import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, FlatList, TextInput, Alert, SafeAreaView, StatusBar as RNStatusBar, Modal, LayoutAnimation, UIManager, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMotorInsurance } from '../../../../contexts/MotorInsuranceContext';
import motorPricingService from '../../../../services/MotorInsurancePricingService';
import djangoAPI from '../../../../services/DjangoAPIService';
import { stripBracketNotes as stripNotes, normalizeName as normName } from '../../../../utils/textSanitizers';

// Enable LayoutAnimation on Android (only if not using New Architecture)
if (
  Platform.OS === 'android' && 
  UIManager.setLayoutAnimationEnabledExperimental &&
  typeof UIManager.setLayoutAnimationEnabledExperimental === 'function'
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
// Design system imports
import { Heading } from '../../../../components/common';
import { BRAND, UI, SPACING } from '../../../../theme';
import { Colors } from '../../../../constants/Colors';
import { Typography } from '../../../../constants/Typography';
import { Spacing } from '../../../../constants/Spacing';

// Import enhanced components
import DynamicPolicyForm from './VehicleDetails/DynamicVehicleForm';
import DynamicPricingForm from './PricingInputs/DynamicPricingForm';
import PremiumCalculationDisplay from './PremiumCalculation/PremiumCalculationDisplay';
import AdditionalCoverageSelector from './AdditionalCoverage/AdditionalCoverageSelector';
import AddonSelectionStep from './AddonsSelection/AddonSelectionStep';
import DocumentsUpload from './DocumentsUpload/DocumentsUpload';
import EnhancedClientForm from './ClientDetails/EnhancedClientForm';
import EnhancedPayment from './Payment/EnhancedPayment';
import UnderwriterSelectionStep from './Comprehensive/UnderwriterSelectionStep';
import PolicySubmission from './Submission/PolicySubmission';
import MotorInsuranceContainer from './MotorInsuranceContainer';

// ============================================================================
// DMVIC SIMULATION CONFIG - Set to true to test existing cover screen
// ============================================================================
const USE_DMVIC_SIMULATION = true; // Toggle this to enable/disable simulation

// Simulated DMVIC response for testing
const SIMULATED_DMVIC_RESPONSE = {
  exists: true,
  policy: {
    policy_number: 'POL/2025/001234',
    vehicle_registration: 'KAA 123A',
    insurer: 'Jubilee Insurance',
    cover_type: 'Comprehensive',
    start_date: '2024-12-01',
    expiry_date: '2025-11-30',
    premium: 'KSh 45,000',
    certificate_number: 'CERT-2025-001234'
  }
};

// Categories will be loaded from backend only - no fallback data

// Cover types for Private vehicles based on correct business flow
const PRIVATE_COVER_TYPES = [
  { name: 'Third Party', type: 'THIRD_PARTY', description: 'Basic third party coverage', priceFrom: 3000 },
  { name: 'Third Party with Extensions', type: 'THIRD_PARTY_EXT', description: 'Third party plus additional benefits', priceFrom: 4000 },
  { name: 'Comprehensive', type: 'COMPREHENSIVE', description: 'Full coverage including own damage', priceFrom: 8000 },
];

// Inline component definitions to make it work immediately
const MotorCategoryGrid = ({ categories, onSelect, bottomPadding = 0, selectedCategory, loading, error }) => {
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingBottom: bottomPadding }]}>
        <Text style={styles.loadingText}>Loading categories from backend...</Text>
      </View>
    );
  }

  if (error || !categories || categories.length === 0) {
    return (
      <View style={[styles.errorContainer, { paddingBottom: bottomPadding }]}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>No Categories Available</Text>
        <Text style={styles.errorText}>
          {error ? 'Failed to load from backend' : 'No insurance categories found'}
        </Text>
      </View>
    );
  }

  const renderItem = ({ item }) => {
    const selected = selectedCategory?.key === item.key;
    return (
      <TouchableOpacity 
        style={[
          styles.categoryCard,
          selected && styles.selectedCard
        ]} 
        onPress={() => onSelect?.(item)}
        activeOpacity={0.8}
      >
        <View style={styles.categoryIconWrapper}>
          <Ionicons 
            name={item.icon || 'car-sport'}
            size={40}
            color="#D5222B"
            style={{ fontWeight: '300' }}
          />
        </View>
        <Text style={styles.categoryTitle}>{item.title}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={categories}
        numColumns={2}
        scrollEnabled={false}
        columnWrapperStyle={{ gap: 16 }}
        contentContainerStyle={{ gap: 16, paddingBottom: bottomPadding, paddingHorizontal: 4 }}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
      />
    </View>
  );
};

const MotorSubcategoryList = ({ items = [], onSelect, bottomPadding = 0 }) => {
  // Remove bracketed notes like "(field tonnage)" or "(Number of passengers)" from display names
  const sanitizeCoverName = (name) => stripNotes(name);
  const normalizeName = (name) => normName(name);

  // Group items by coverage type
  const groupedItems = React.useMemo(() => {
    const thirdParty = [];
    const comprehensive = [];
    
    items.forEach(item => {
      const type = (item.type || item.cover_type || '').toUpperCase();
      const name = (item.name || '').toUpperCase();
      
      // Check if it's comprehensive
      if (type.includes('COMPREHENSIVE') || type === 'COMP' || name.includes('COMPREHENSIVE')) {
        comprehensive.push(item);
      } 
      // Everything else is third party (including TOR, TPO, Third-Party, Extendible)
      else {
        thirdParty.push(item);
      }
    });
    
    return { thirdParty, comprehensive };
  }, [items]);

  const toTitle = (str = '') => {
    if (!str) return '';
    // Replace underscores with spaces and title-case words
    return String(str)
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.subcategoryCard} onPress={() => onSelect?.(item)}>
      <Text style={styles.subcategoryTitle}>{toTitle(item.name || item.code || item.type)}</Text>
      <View style={styles.badgesRow}>
        <Text style={styles.badge}>{toTitle(item.type)}</Text>
        {item.is_extendible ? (
          <Text style={[styles.badge, styles.badgeInfo]}>Extendible</Text>
        ) : null}
      </View>
      {item.requirements?.length > 0 && (
        <Text style={styles.requirements}>Requires: {item.requirements.join(', ')}</Text>
      )}
    </TouchableOpacity>
  );

  const renderSectionHeader = (title) => (
    <View style={styles.sectionHeaderContainer}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  // Curate backend cover types to match the business MD list per category
  // Currently scoped to PRIVATE to align exactly with:
  // - Private third-party
  // - Private third-party Extendible
  // - Private comprehensive
  // Other categories pass through unchanged for now.
  const curateCoverTypes = (categoryCode, list) => {
    if (!Array.isArray(list)) return [];
    // Desired labels per category as per MD (without bracketed hints)
    const desiredByCategory = {
      COMMERCIAL: [
        // Third Party (9)
        'Own Goods Third-Party',
        'General Cartage Third-Party',
        'Commercial TukTuk Third-Party',
        'Commercial Tuktuk Third-Party Extendible',
        'Own Goods Third-Party Extendible',
        'General Cartage Third-Party Extendible',
        'General Cartage Third-Party Prime Mover',
        'General Cartage Third-Party Extendible Prime Mover',
        // Comprehensive (3)
        'Commercial TukTuk Comprehensive',
        'General Cartage Comprehensive',
        'Own Goods Comprehensive',
      ],
      PSV: [
        // Third Party – PSV (10)
        'PSV Uber Third-Party',
        'PSV Tuk-Tuk Third-Party',
        'PSV Tuk-Tuk Third-Party Extendible',
        '1 Month PSV Matatu Third-Party',
        '2 Weeks PSV Matatu Third-Party',
        'PSV Uber Third-Party Extendible',
        'PSV Tour Van Third-Party',
        '1 week PSV Matatu-third party Extendible',
        'PSV Plain TPO',
        'PSV Tour Van Third-party Extendible',
        // Comprehensive (2)
        'PSV UBER COMPREHENSIVE',
        'PSV TOUR VAN COMPREHENSIVE',
      ],
      MOTORCYCLE: [
        // Thirdparty (3)
        'Private motorcycle third party',
        'Psv motorcycle third party',
        'PSV Motocycle third-party 6 months',
        // Comprehensive (3)
        'Private Motorcyle comprehensive',
        'PSV Motorcycle comprehensive',
        'Psv motorcycle comprehensive  6 month',
      ],
      TUKTUK: [
        // Third Party (4)
        'PSV Tuk-Tuk Third-Party',
        'PSV Tuk-Tuk Third-Party Extendible',
        'Commercial TukTuk Third-Party',
        'Commercial Tuktuk Third-Party Extendible',
        // Comprehensive (2)
        'Commercial TukTuk Comprehensive',
        'PSV Tuk-Tuk Comprehensive',
      ],
      SPECIAL: [
        // Third Party (4) + extra listed
        'Agricultural Tractor Third-Party',
        'Commercial Institutional Third-Party',
        'Commercial Institutional Third-Party Extendible',
        'KG Plate Third-Party',
        'Driving School Third-Party',
        // Comprehensive (5)
        'Agricultural Tractor Comprehensive',
        'Commercial Institutional Comprehensive',
        'Driving School Comprehensive',
        'Fuel Tankers Comprehensive',
        'Commercial Ambulance Comprehensive',
      ],
    };

    const selectInOrder = (desiredLabels, covers) => {
      const coversByName = new Map();
      covers.forEach((ct) => {
        coversByName.set(normalizeName(ct.name), ct);
      });
      const picked = [];
      desiredLabels.forEach((label) => {
        const found = coversByName.get(normalizeName(label));
        if (found) picked.push({ ...found, name: sanitizeCoverName(label) });
      });
      return picked;
    };

    if (categoryCode === 'PRIVATE') {
      // Prefer matching by backend codes when available, then by cover_type
      const byCode = Object.fromEntries(list.map(ct => [ct.code, ct]));
      const byType = list.reduce((acc, ct) => {
        const key = String(ct.cover_type || '').toUpperCase();
        if (!acc[key]) acc[key] = [];
        acc[key].push(ct);
        return acc;
      }, {});
      const pick = (code, fallbackType) => byCode[code] || (byType[fallbackType] ? byType[fallbackType][0] : null);
      const ordered = [
        { code: 'PRIVATE_THIRD_PARTY', label: 'Private Third-Party', type: 'THIRD_PARTY' },
        { code: 'PRIVATE_TP_EXT', label: 'Private Third-Party Extendible', type: 'THIRD_PARTY_EXT' },
        { code: 'PRIVATE_COMPREHENSIVE', label: 'Private Comprehensive', type: 'COMPREHENSIVE' },
      ]
        .map(spec => {
          const ct = pick(spec.code, spec.type);
          if (!ct) return null;
          return { ...ct, name: sanitizeCoverName(spec.label) };
        })
        .filter(Boolean);
      return ordered;
    }
    // For other categories, try curated selection by desired labels; fall back to sanitized list if none match
    const desired = desiredByCategory[categoryCode];
    if (Array.isArray(desired)) {
      const picked = selectInOrder(desired, list);
      if (picked.length > 0) return picked;
    }
    return list.map(ct => ({ ...ct, name: sanitizeCoverName(ct.name) }));
  };

  return (
    <ScrollView 
      style={{ flex: 1 }} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: bottomPadding }}
    >
      {/* Third Party Section */}
      {groupedItems.thirdParty.length > 0 && (
        <View>
          {renderSectionHeader('Third Party')}
          {groupedItems.thirdParty.map((item, idx) => (
            <View key={item.code || `tp-${idx}`}>
              {renderItem({ item })}
              {idx < groupedItems.thirdParty.length - 1 && <View style={{ height: 8 }} />}
            </View>
          ))}
        </View>
      )}
      
      {/* Spacing between sections */}
      {groupedItems.thirdParty.length > 0 && groupedItems.comprehensive.length > 0 && (
        <View style={{ height: 24 }} />
      )}
      
      {/* Comprehensive Section */}
      {groupedItems.comprehensive.length > 0 && (
        <View>
          {renderSectionHeader('Comprehensive')}
          {groupedItems.comprehensive.map((item, idx) => (
            <View key={item.code || `comp-${idx}`}>
              {renderItem({ item })}
              {idx < groupedItems.comprehensive.length - 1 && <View style={{ height: 8 }} />}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const FormField = ({ label, value, onChangeText, placeholder, keyboardType, error }) => (
  <View style={{ gap: 6 }}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
    />
    {error && <Text style={styles.error}>{error}</Text>}
  </View>
);

const ProgressIndicator = ({ steps = [], current = 0 }) => {
  // Show all step numbers with current step having its label
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressRow}>
        {steps.map((step, idx) => {
          const isCompleted = idx < current;
          const isActive = idx === current;
          const stepLabel = step === 'Category' ? 'Vehicle Type' : step;
          
          if (isActive) {
            // Current step: show number with label
            return (
              <View key={step} style={styles.progressActiveStep}>
                <View style={styles.progressDotActive}>
                  <Text style={styles.progressTextActive}>{idx + 1}</Text>
                </View>
                <Text style={styles.progressLabelActive}>{stepLabel}</Text>
              </View>
            );
          } else {
            // Other steps: show just the number
            return (
              <View key={step} style={styles.progressDotSmall}>
                <View style={[
                  styles.progressCircleSmall,
                  isCompleted && styles.progressCircleCompleted,
                ]}>
                  <Text style={[
                    styles.progressNumberSmall,
                    isCompleted && styles.progressNumberActive
                  ]}>
                    {idx + 1}
                  </Text>
                </View>
              </View>
            );
          }
        })}
      </View>
      
      {/* Divider below progress indicator */}
      <View style={styles.progressDivider} />
    </View>
  );
};

const NavigationButtons = ({ onNext, onBack, canNext, showBackOnFirstStep = false, isFirstStep, onHome, validationMessage, insets }) => (
  <View style={styles.navRow}>
    <View style={[styles.navigationButtonsContainer, { paddingBottom: insets.bottom + 8 }]}>
      {/* Show back button when not on first step, or home button on first step if requested */}
      {!isFirstStep ? (
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={20} color="#495057" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      ) : (showBackOnFirstStep && (
        <TouchableOpacity style={styles.backButton} onPress={onHome} activeOpacity={0.75}>
          <Ionicons name="home-outline" size={20} color="#495057" />
          <Text style={styles.backButtonText}>Home</Text>
        </TouchableOpacity>
      ))}
      
      {/* Hide Next button on first step (category selection) - user clicks category card to proceed */}
      {!isFirstStep && (
        <TouchableOpacity 
          style={[styles.nextButton, !canNext && styles.nextButtonDisabled]} 
          onPress={onNext}
          disabled={!canNext}
          activeOpacity={0.75}
        >
          <Text style={styles.nextButtonText}>Next</Text>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

// Helper function to get cover types based on category
const getCoverTypesByCategory = (categoryCode) => {
  switch (categoryCode) {
    case 'PRIVATE':
      return [
        { code: 'PRIVATE_TP', name: 'Third Party', type: 'THIRD_PARTY', description: 'Basic third party coverage', requirements: [] },
        { code: 'PRIVATE_TPX', name: 'Third Party with Extensions', type: 'THIRD_PARTY_EXT', description: 'Third party plus additional benefits', requirements: [] },
        { code: 'PRIVATE_COMP', name: 'Comprehensive', type: 'COMPREHENSIVE', description: 'Full coverage including own damage', requirements: ['Sum Insured'] }
      ];
    case 'COMMERCIAL':
      return [
        { code: 'COMM_TP', name: 'Commercial Third Party', type: 'THIRD_PARTY', description: 'Third party for commercial vehicles', requirements: ['Tonnage'] },
        { code: 'COMM_COMP', name: 'Commercial Comprehensive', type: 'COMPREHENSIVE', description: 'Full coverage for commercial vehicles', requirements: ['Tonnage', 'Sum Insured'] }
      ];
    case 'PSV':
      return [
        { code: 'PSV_TP', name: 'PSV Third Party', type: 'THIRD_PARTY', description: 'Third party for passenger vehicles', requirements: ['Passenger Count'] },
        { code: 'PSV_COMP', name: 'PSV Comprehensive', type: 'COMPREHENSIVE', description: 'Full PSV coverage', requirements: ['Passenger Count', 'Sum Insured'] }
      ];
    case 'MOTORCYCLE':
      return [
        { code: 'MOTO_TP', name: 'Motorcycle Third Party', type: 'THIRD_PARTY', description: 'Third party for motorcycles', requirements: [] },
        { code: 'MOTO_COMP', name: 'Motorcycle Comprehensive', type: 'COMPREHENSIVE', description: 'Full motorcycle coverage', requirements: ['Sum Insured'] }
      ];
    case 'TUKTUK':
      return [
        { code: 'TUKTUK_TP', name: 'TukTuk Third Party', type: 'THIRD_PARTY', description: 'Third party for TukTuk', requirements: [] },
        { code: 'TUKTUK_COMP', name: 'TukTuk Comprehensive', type: 'COMPREHENSIVE', description: 'Full TukTuk coverage', requirements: ['Sum Insured'] }
      ];
    case 'SPECIAL':
      return [
        { code: 'SPECIAL_TP', name: 'Special Class Third Party', type: 'THIRD_PARTY', description: 'Third party for special vehicles', requirements: ['Vehicle Type'] },
        { code: 'SPECIAL_COMP', name: 'Special Class Comprehensive', type: 'COMPREHENSIVE', description: 'Full coverage for special vehicles', requirements: ['Vehicle Type', 'Sum Insured'] }
      ];
    default:
      return PRIVATE_COVER_TYPES;
  }
};

export default function MotorInsuranceScreen(props) {
  // Temporary delegation to the new container during refactor
  return <MotorInsuranceContainer {...props} />;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { state, actions } = useMotorInsurance();
  
  // Extract route params for draft resumption and direct payment
  const startAtPayment = route?.params?.startAtPayment || false;
  const draftData = route?.params?.draftData || null;
  const draftQuoteId = route?.params?.draftQuoteId || null;
  
  // Helper function to get readable coverage names
  const getReadableCoverageName = useCallback((subcategory) => {
    if (!subcategory) return 'selected coverage';
    
    // Map codes to readable names
    const coverageNames = {
      'PRIVATE_THIRD_PARTY': 'Private Third Party',
      'PRIVATE_THIRD_PARTY_EXT': 'Private Third Party Extended',
      'PRIVATE_COMPREHENSIVE': 'Private Comprehensive',
      'COMMERCIAL_THIRD_PARTY': 'Commercial Third Party',
      'COMMERCIAL_COMPREHENSIVE': 'Commercial Comprehensive',
      'PSV_THIRD_PARTY': 'PSV Third Party',
      'PSV_COMPREHENSIVE': 'PSV Comprehensive',
      'MOTORCYCLE_THIRD_PARTY': 'Motorcycle Third Party',
      'MOTORCYCLE_COMPREHENSIVE': 'Motorcycle Comprehensive',
      'TUKTUK_THIRD_PARTY': 'TukTuk Third Party',
      'TUKTUK_COMPREHENSIVE': 'TukTuk Comprehensive'
    };
    
    // Try to get from the mapping first, then fallback to name or code
    return coverageNames[subcategory.code] || 
           coverageNames[subcategory.type] || 
           subcategory.name || 
           subcategory.code || 
           'selected coverage';
  }, []);
  
  // Normalizes various canonical field shapes returned by OCR into our expected keys
  const normalizeExtractedFields = useCallback((fields = {}) => {
    const f = fields || {};
    const pick = (...keys) => {
      for (let k of keys) {
        if (f[k] !== undefined && f[k] !== null && f[k] !== '') return f[k];
      }
      return undefined;
    };
    return {
      owner_name: pick('owner_name', 'ownerName', 'fullName', 'name', 'policyholder_name'),
      email: pick('email', 'owner_email', 'contact_email'),
      phone: pick('phone', 'phoneNumber', 'owner_phone', 'mobile', 'contact_phone'),
      registration_number: pick('registration_number', 'registrationNumber', 'vehicle_registration', 'registration', 'regNo', 'regno', 'reg_number'),
      chassis_number: pick('chassis_number', 'chassisNumber'),
      engine_number: pick('engine_number', 'engineNumber', 'engine'),
      kra_pin: pick('kra_pin', 'kraPin', 'pin', 'kra'),
      id_number: pick('id_number', 'idNumber', 'national_id', 'nationalId', 'nid'),
      make: pick('make', 'vehicle_make', 'manufacturer'),
      model: pick('model', 'vehicle_model', 'variant'),
      year: pick('year', 'yearOfManufacture', 'manufacture_year', 'year_of_manufacture', 'vehicle_year'),
    };
  }, []);
  
  // Use step from context for persistence across navigation
  // Guard against accidental non-number (e.g., a function mistakenly stored previously)
  const step = typeof state.currentStep === 'number' && Number.isFinite(state.currentStep)
    ? state.currentStep
    : 0;
  // Support functional updates locally and always dispatch a bounded numeric step
  const setStep = useCallback((nextOrUpdater) => {
    try {
      const computed = typeof nextOrUpdater === 'function' ? nextOrUpdater(step) : nextOrUpdater;
      let next = Number(computed);
      if (!Number.isFinite(next)) next = 0;
      // Bound within available steps (rely on current steps length)
      const maxIndex = Math.max(0, (Array.isArray(steps) ? steps.length : 1) - 1);
      const bounded = Math.min(Math.max(0, next), maxIndex);
      actions.setCurrentStep(bounded);
    } catch (e) {
      // Fallback to step 0 on any unexpected input
      actions.setCurrentStep(0);
    }
  }, [actions, step, steps]);
  
  // Use extracted documents from context for persistence
  const extractedData = state.extractedDocuments || {};
  const setExtractedData = useCallback((updates) => {
    if (typeof updates === 'function') {
      // Handle functional updates
      const newData = updates(state.extractedDocuments || {});
      actions.updateExtractedDocuments(newData);
    } else {
      actions.updateExtractedDocuments(updates);
    }
  }, [state.extractedDocuments, actions]);
  
  // Handler for document extraction with vehicle field auto-fill
  const handleDocumentExtracted = useCallback((documentKey, canonicalFields) => {
    console.log(`📄 Document extracted: ${documentKey}`, canonicalFields);
    
    // Store extracted data for client form
    const normalized = normalizeExtractedFields(canonicalFields || {});
    console.log(`🔧 Normalized fields for ${documentKey}:`, normalized);
    
    setExtractedData(prev => ({
      ...prev,
      [documentKey]: normalized
    }));
    
    // If logbook was extracted, auto-fill vehicle details
    if (documentKey === 'logbook' && normalized) {
      // Use normalized fields instead of raw canonicalFields
      const { 
        registration_number,
        make, 
        model, 
        year,
        chassis_number,
        engine_number
      } = normalized;
      
      // Determine if this is TOR or Third Party (fields should be locked)
      const coverage = state.selectedSubcategory?.coverage_type || state.selectedSubcategory?.type || '';
      const isTOROrThirdParty = 
        coverage.toLowerCase().includes('tor') ||
        coverage.toLowerCase().includes('third_party') ||
        coverage.toLowerCase().includes('third-party') ||
        coverage.toLowerCase() === 'tpo';
      
      // Build auto-fill data with lock indicators - using normalized field names
      const autoFillData = {
        registrationNumber: registration_number,
        make: make,
        model: model,
        year: year,
        chassisNumber: chassis_number,
        engineNumber: engine_number,
        // Add metadata flags
        isAutoFilled: true,
        autoFillSource: 'logbook',
        // Lock fields for TOR/Third Party, keep editable for Comprehensive
        isLocked: isTOROrThirdParty
      };
      
      // Filter out undefined values
      const cleanedData = Object.entries(autoFillData).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});
      
      // Update vehicle details in context
      if (Object.keys(cleanedData).length > 0) {
        actions.updateVehicleDetails(cleanedData);
        
        // Show success alert with appropriate message
        const lockMessage = isTOROrThirdParty 
          ? '🔒 Vehicle details have been locked (TOR/Third Party policy)'
          : '✏️ Vehicle details are editable (Comprehensive policy)';
        
        Alert.alert(
          '✅ Logbook Extracted Successfully',
          `Vehicle details have been auto-filled from your logbook.\n\n${lockMessage}`,
          [{ text: 'OK', style: 'default' }]
        );
        
        console.log('✅ Vehicle details auto-filled:', cleanedData);
      }
    }
  }, [state.selectedSubcategory, actions]);
  
  // Dynamic step sequence based on coverage type
  const steps = useMemo(() => {
    const sel = state.selectedSubcategory;
    const rawType = sel?.coverage_type ?? sel?.type ?? '';
    const norm = typeof rawType === 'string' ? rawType.toUpperCase().trim() : '';
    const isComprehensive = norm === 'COMPREHENSIVE' || norm === 'COMP' || norm.includes('COMPREHENSIVE');

    if (isComprehensive) {
      // Comprehensive flow: Category -> Subcategory -> Vehicle Details -> Underwriters -> Add-ons -> Client Details -> Submission
      // Note: Vehicle Verification (step 3) is skipped in navigation logic
      // Note: No Payment step for comprehensive (direct quote generation)
      return ['Category', 'Subcategory', 'Vehicle Details', 'Vehicle Verification', 'Underwriters', 'Add-ons', 'Client Details', 'Submission'];
    }

    // Standard flow: Category -> Subcategory -> Vehicle Details -> Vehicle Verification -> Documents -> Client Details -> Payment -> Submission
    return ['Category', 'Subcategory', 'Vehicle Details', 'Vehicle Verification', 'Documents', 'Client Details', 'Payment', 'Submission'];
  }, [state.selectedSubcategory?.coverage_type, state.selectedSubcategory?.type]);

  // Handle direct payment navigation from draft quotations
  const [paymentInitialized, setPaymentInitialized] = useState(false);
  useEffect(() => {
    if (startAtPayment && draftData && !paymentInitialized) {
      console.log('[MotorInsuranceScreen] Direct payment mode detected', {
        quoteId: draftQuoteId,
        totalPremium: draftData.totalPremium
      });
      
      // Populate context with draft data
      if (draftData.vehicleDetails) {
        actions.updateVehicleDetails(draftData.vehicleDetails);
      }
      if (draftData.clientInfo) {
        actions.updateClientDetails(draftData.clientInfo);
      }
      if (draftData.coverageDetails) {
        actions.updateCoverageDetails && actions.updateCoverageDetails(draftData.coverageDetails);
      }
      if (draftData.underwriterName) {
        // Set selected underwriter if available
        const underwriterData = {
          name: draftData.underwriterName,
          total_premium: draftData.totalPremium,
          breakdown: draftData.premiumBreakdown
        };
        actions.setSelectedUnderwriter && actions.setSelectedUnderwriter(underwriterData);
      }
      
      // Mark as initialized to prevent re-running
      setPaymentInitialized(true);
      
      // Jump to payment step (step 6) after a brief delay to ensure context is updated
      setTimeout(() => {
        const paymentStepIndex = steps.indexOf('Payment');
        if (paymentStepIndex >= 0) {
          actions.setCurrentStep(paymentStepIndex);
        }
      }, 100);
    }
  }, [startAtPayment, draftData, draftQuoteId, paymentInitialized, steps, actions]);

  // Handle Comprehensive quote submission (save as draft, not policy)
  const [comprehensiveQuoteSaved, setComprehensiveQuoteSaved] = useState(false);
  useEffect(() => {
    const sel = state.selectedSubcategory;
    const rawType = sel?.coverage_type ?? sel?.type ?? '';
    const norm = typeof rawType === 'string' ? rawType.toUpperCase().trim() : '';
    const isComprehensive = norm === 'COMPREHENSIVE' || norm === 'COMP' || norm.includes('COMPREHENSIVE');
    const submissionStepIndex = isComprehensive ? 7 : 7;

    if (isComprehensive && step === submissionStepIndex && !comprehensiveQuoteSaved) {
      const saveComprehensiveQuote = async () => {
        try {
          console.log('[MotorInsuranceScreen] Saving comprehensive quote as draft...');
          
          // Prepare quote data
          const quoteData = {
            vehicleRegistration: state.vehicleDetails?.registrationNumber || state.vehicleDetails?.registration || '',
            vehicleMake: state.vehicleDetails?.make || '',
            vehicleModel: state.vehicleDetails?.model || '',
            vehicleYear: state.vehicleDetails?.year || '',
            sumInsured: state.vehicleDetails?.sum_insured || 0,
            category: state.selectedCategory?.name || '',
            subcategory: state.selectedSubcategory?.name || '',
            coverageType: state.selectedSubcategory?.coverage_type || 'Comprehensive',
            underwriterName: state.selectedUnderwriter?.name || state.selectedUnderwriter?.underwriter_name || '',
            underwriterId: state.selectedUnderwriter?.id || state.selectedUnderwriter?.underwriter_id || '',
            totalPremium: state.selectedUnderwriter?.total_premium || 0,
            premiumBreakdown: state.selectedUnderwriter?.breakdown || {},
            clientName: state.pricingInputs?.clientDetails?.fullName || state.pricingInputs?.clientDetails?.full_name || '',
            clientEmail: state.pricingInputs?.clientDetails?.email || '',
            clientPhone: state.pricingInputs?.clientDetails?.phone || '',
            selectedAddons: state.selectedAddons || [],
            addonsPremium: state.addonsPremium || 0,
            status: 'draft',
            createdAt: new Date().toISOString(),
          };

          console.log('[MotorInsuranceScreen] Quote data:', quoteData);

          // Save to AsyncStorage as draft
          const quoteId = `QUOTE-${Date.now()}`;
          await AsyncStorage.setItem(`draft_quote_${quoteId}`, JSON.stringify(quoteData));
          
          setComprehensiveQuoteSaved(true);

          // Navigate to Quote Success screen
          navigation.navigate('QuoteSuccess', {
            quoteId: quoteId,
            quoteData: quoteData
          });

          // Reset motor insurance context after navigation
          setTimeout(() => {
            actions.resetFlow && actions.resetFlow();
          }, 500);
        } catch (error) {
          console.error('[MotorInsuranceScreen] Error saving comprehensive quote:', error);
          Alert.alert(
            'Error',
            'Failed to save quote. Please try again.',
            [
              { text: 'OK', onPress: () => setStep(7) }
            ]
          );
        }
      };

      saveComprehensiveQuote();
    }
  }, [step, state, comprehensiveQuoteSaved, actions, navigation]);

  const [categories, setCategories] = useState([]); // Start with empty, loaded from backend only
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);
  // Use context for subcategories instead of local state
  const subcategories = state.availableSubcategories || [];
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
  const [subcategoriesError, setSubcategoriesError] = useState(null);
  const [registration, setRegistration] = useState({
    number: '',
    startDate: ''
  });
  const [verificationStatus, setVerificationStatus] = useState(null); // null | 'checking' | 'found' | 'not_found'
  const [existingCoverData, setExistingCoverData] = useState(null); // Stores DMVIC verification result
  const [existingCoverDrawerVisible, setExistingCoverDrawerVisible] = useState(false); // Controls bottom drawer visibility
  // Cross-platform modal for entering registration when checking existing cover
  const [showCheckPolicyModal, setShowCheckPolicyModal] = useState(false);
  const [checkPolicyInput, setCheckPolicyInput] = useState('');

  // Use context for client data source to persist across steps
  const clientDataSource = state.clientDataSource || 'logbook';
  const setClientDataSource = (source) => {
    actions.setClientDataSource && actions.setClientDataSource(source);
  };

  // Auto-open drawer when existing cover is found and user enters step 3
  useEffect(() => {
    if (step === 3 && existingCoverData && verificationStatus === 'found') {
      // Small delay to ensure smooth transition
      setTimeout(() => setExistingCoverDrawerVisible(true), 300);
    }
  }, [step, existingCoverData, verificationStatus]);
  const [providerDetails, setProviderDetails] = useState({
    underwriter: '',
    existingCover: false,
    policyNumber: ''
  });
  const [kycDocuments, setKycDocuments] = useState({
    nationalId: null,
    kraPin: null,
    logbook: null,
    verified: false
  });
  const [payment, setPayment] = useState({
    method: '',
    confirmed: false,
    transactionId: ''
  });

  // Basic vehicle policy verification leveraging backend (placeholder endpoint) or fallback mock
  const verifyExistingPolicy = useCallback(async () => {
    const reg = (registration.number || '').trim().toUpperCase();
    if (!reg) {
      Alert.alert('Registration Required', 'Enter a vehicle registration number first.');
      return;
    }
    try {
      setVerificationStatus('checking');
      try {
        const resp = await djangoAPI.get(`/api/insurance/motor/policies/verify/?registration=${encodeURIComponent(reg)}`);
        if (resp && resp.exists) {
          setVerificationStatus('found');
          Alert.alert('Existing Policy', `An active policy was found: ${resp.policy_number} (Underwriter: ${resp.underwriter || 'N/A'}) expiring ${resp.expiry_date || 'unknown'}.`);
        } else {
          setVerificationStatus('not_found');
          Alert.alert('No Active Policy', 'No active policy found. You may proceed to create a new one.');
        }
        return;
      } catch (apiErr) {
        console.log('Backend verify endpoint not available or failed, falling back to mock. Error:', apiErr?.message);
      }
      const pattern = /^K[A-Z]{2}\d{3}[A-Z]$/;
      if (pattern.test(reg)) {
        setVerificationStatus('not_found');
        Alert.alert('No Active Policy (Assumed)', 'Pattern looks valid but no record returned. Proceed with new policy.');
      } else {
        setVerificationStatus('not_found');
        Alert.alert('Unrecognized Format', 'Format not recognized in mock lookup. Proceed manually.');
      }
    } catch (err) {
      console.error('Verification unexpected error:', err);
      setVerificationStatus(null);
      Alert.alert('Verification Error', 'Could not verify policy at this time. Try again later.');
    }
  }, [registration.number]);

  // Load subcategories for selected category from backend
  const loadSubcategoriesForCategory = async (categoryCode) => {
    // Check cache first
    const cacheKey = `motor_subcategories_${categoryCode}`;
    
    setSubcategoriesLoading(true);
    setSubcategoriesError(null);
    
    try {
      // Try to load from cache first
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        const cacheAge = Date.now() - (parsedCache.timestamp || 0);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (cacheAge < maxAge) {
          console.log('✅ Loading subcategories from cache:', categoryCode);
          actions.setSubcategories(parsedCache.data);
          setSubcategoriesLoading(false);
          return;
        }
      }
      
      console.log('📡 Loading subcategories from backend:', categoryCode);
      const list = await djangoAPI.getSubcategories(categoryCode);
      console.log('Subcategories response:', list);
      const transformed = (Array.isArray(list) ? list : []).map((sub) => {
        const type = String(sub.cover_type || sub.product_type || sub.pricing_model || '').toUpperCase();
        const rawReq = sub.pricing_requirements || sub.required_fields || [];
        const requirements = Array.isArray(rawReq) ? rawReq : Object.values(rawReq || {});
        return {
          id: sub.id,
          code: sub.subcategory_code || sub.code,
          subcategory_code: sub.subcategory_code || sub.code,
          name: sub.subcategory_name || sub.name,
          type,
          pricing_model: sub.pricing_model,
          description: sub.description,
          requirements,
          is_extendible: Boolean(sub.is_extendible),
          extendible_variant_id: sub.extendible_variant_id || sub.extendible_variant || null,
          additionalFields: sub.additional_fields || sub.additionalFields || [],
          fieldValidations: sub.field_validations || sub.fieldValidations || {},
          complex: (sub.pricing_model && sub.pricing_model !== 'FIXED') || requirements.length > 0,
          raw: sub,
        };
      });
      actions.setSubcategories(transformed);
      
      // Cache the results
      await AsyncStorage.setItem(cacheKey, JSON.stringify({
        data: transformed,
        timestamp: Date.now()
      }));
      console.log('✅ Subcategories cached for:', categoryCode);
      
    } catch (error) {
      console.error('Error loading subcategories:', error);
      setSubcategoriesError(error.message);
      actions.setSubcategories([]);
    } finally {
      setSubcategoriesLoading(false);
    }
  };

  // Load categories and underwriters on mount
  useEffect(() => {
    const loadInitialData = async () => {
      setCategoriesLoading(true);
      setCategoriesError(null);
      
      // IMPORTANT: Clear ALL Motor2 caches on mount to prevent data bleeding between policies
      try {
        // Clear DjangoAPIService field requirements cache
        djangoAPI.clearMotor2Cache();
        
        // Clear all Motor2-related AsyncStorage caches
        const motor2CacheKeys = [
          'motor_insurance_flow_state',
          'cache_underwriters',
          'cache_last_premium',
          'policy_submission_guard',
        ];
        
        await Promise.all(
          motor2CacheKeys.map(key => AsyncStorage.removeItem(key).catch(() => {}))
        );
        
        // Also clear any subcategory caches (these use dynamic keys)
        const allKeys = await AsyncStorage.getAllKeys();
        const subcategoryCacheKeys = allKeys.filter(key => 
          key.startsWith('motor_subcategories_') || 
          key.startsWith('cache_underwriters_') ||
          key.startsWith('cache_pricing_')
        );
        await Promise.all(
          subcategoryCacheKeys.map(key => AsyncStorage.removeItem(key).catch(() => {}))
        );
        
        console.log('🧹 All Motor2 caches cleared on mount - fresh start');
      } catch (e) {
        console.warn('Failed to clear Motor2 caches:', e);
      }
      
      try {
        // Try to load from cache first
        const cached = await AsyncStorage.getItem('motor_categories');
        if (cached) {
          const parsedCache = JSON.parse(cached);
          const cacheAge = Date.now() - (parsedCache.timestamp || 0);
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours
          
          if (cacheAge < maxAge) {
            console.log('✅ Loading categories from cache');
            setCategories(parsedCache.data);
            setCategoriesLoading(false);
            
            // Load in background and update if changed
            motorPricingService.getCategories().then(async (backendCategories) => {
              if (backendCategories && backendCategories.length > 0) {
                const formattedCategories = formatCategories(backendCategories);
                setCategories(formattedCategories);
                await AsyncStorage.setItem('motor_categories', JSON.stringify({
                  data: formattedCategories,
                  timestamp: Date.now()
                }));
              }
            }).catch(err => console.warn('Background category update failed:', err));
            
            // Continue with underwriters
            await actions.loadUnderwriters();
            return;
          }
        }
        
        // Load categories from backend
        console.log('📡 Loading categories from backend');
        const backendCategories = await motorPricingService.getCategories();
        console.log('Backend categories response:', backendCategories);
        
        if (backendCategories && backendCategories.length > 0) {
          const formattedCategories = formatCategories(backendCategories);
          console.log('Formatted categories:', formattedCategories);
          setCategories(formattedCategories);
          
          // Cache the results
          await AsyncStorage.setItem('motor_categories', JSON.stringify({
            data: formattedCategories,
            timestamp: Date.now()
          }));
          console.log('✅ Categories cached');
        } else {
          // If backend returns empty, show error message instead of fallback
          console.error('Backend returned empty categories - cannot proceed');
          setCategoriesError('No categories available from backend');
          setCategories([]);
        }

        // Load underwriters using context action
        const uw = await actions.loadUnderwriters();
        // Log the fetched underwriters for debugging/verification
        try {
          console.log('[MotorInsuranceScreen] Underwriters fetched:', uw);
        } catch {}
        
      } catch (error) {
        console.error('Failed to load categories from backend:', error);
        // Show error state instead of fallback data
        setCategoriesError(error.message || 'Failed to load categories');
        setCategories([]);
        Alert.alert(
          'Connection Error',
          'Unable to load insurance categories from server. Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadInitialData();
  }, []);
  
  // Helper function to format categories
  const formatCategories = (backendCategories) => {
    return backendCategories.map(cat => {
      const formattedSubcategories = (cat.subcategories || []).map(sub => {
        const rawRequirements = sub.pricing_requirements || sub.required_fields || [];
        const requirements = Array.isArray(rawRequirements)
          ? rawRequirements
          : Object.values(rawRequirements || {});

        return {
          id: sub.id,
          code: sub.subcategory_code || sub.code,
          // Ensure compatibility with context/selectors expecting `subcategory_code`
          subcategory_code: sub.subcategory_code || sub.code,
          name: sub.subcategory_name || sub.name,
          // Normalize to UPPERCASE for consistent display; callers can lowercase when needed
          type: (sub.product_type || sub.cover_type || sub.pricing_model || '').toString().toUpperCase(),
          pricing_model: sub.pricing_model,
          description: sub.description,
          requirements,
          // New fields from DB to preserve extendibility and dynamic form metadata
          is_extendible: Boolean(sub.is_extendible),
          extendible_variant_id: sub.extendible_variant_id || sub.extendible_variant || null,
          additionalFields: sub.additional_fields || sub.additionalFields || [],
          fieldValidations: sub.field_validations || sub.fieldValidations || {},
          complex: (sub.pricing_model && sub.pricing_model !== 'FIXED') || requirements.length > 0,
          raw: sub,
        };
      });

      return {
        key: cat.code || cat.category_code || cat.id,
        category_code: cat.code || cat.category_code,
        title: cat.name || cat.category_name,
        icon: getCategoryIcon(cat.code || cat.category_code || cat.name),
        desc: cat.description || getDefaultDescription(cat.name || cat.category_name),
        subcategories: formattedSubcategories,
        raw: cat,
      };
    });
  };

  // Load subcategories when category is selected
  useEffect(() => {
    if (state.selectedCategory && step === 1) {
      const categoryCode = state.selectedCategory.category_code || state.selectedCategory.key;
      
      // IMPORTANT: Always clear and reload subcategories when category changes
      // This prevents showing wrong subcategories from previous category
      console.log('Loading subcategories for selected category:', categoryCode);
      actions.setSubcategories([]); // Clear old subcategories first
      loadSubcategoriesForCategory(categoryCode);
    }
  }, [state.selectedCategory?.category_code, state.selectedCategory?.key, step]);

  // Helper functions
  const getCategoryIcon = (code) => {
    // Map category codes to Ionicons names for better visual representation
    const iconMap = {
      'PRIVATE': 'car-sport-outline', // Sedan/private car
      'COMMERCIAL': 'cube-outline', // Truck/cargo icon
      'PSV': 'bus-outline', // Public service vehicle bus
      'MOTORCYCLE': 'bicycle-outline', // Motorcycle/bike
      'TUKTUK': 'car-outline', // Three-wheeler TukTuk
      'SPECIAL': 'construct-outline', // Agricultural/special vehicles
    };
    return iconMap[code] || 'car-outline';
  };

  const getDefaultDescription = (name) => {
    const descMap = {
      'Private': 'Personal vehicles',
      'Commercial': 'Goods carriers',
      'PSV': 'Passenger service',
      'Motorcycle': 'Boda & private',
      'TukTuk': 'Three-wheeler',
      'Special': 'Agric./institutional'
    };
    return descMap[name] || 'Motor vehicle insurance';
  };

  // Auto-calculate premium when relevant data changes
  // Important: avoid depending on `actions` or the whole `vehicleDetails` object to prevent render loops
  useEffect(() => {
    if (step >= 4 && state.productType && state.vehicleDetails?.make) {
      console.log('[MotorInsuranceScreen] Auto-calc premium trigger', {
        step,
        productType: state.productType,
        make: state.vehicleDetails?.make,
      });
      // Do not include `actions` in deps; it's recreated by provider on state changes
      actions.calculatePremium();
    }
  }, [step, state.productType, state.vehicleDetails?.make]);

  // Note: Underwriter selection logic removed as it's no longer part of the main flow

  // Local helpers
  const formatCurrency = (amount) => `KSh ${(Number(amount) || 0).toLocaleString()}`;

  const canProceed = () => {
    const rawType = state.selectedSubcategory?.coverage_type || state.selectedSubcategory?.type || '';
    const isComp = typeof rawType === 'string' && rawType.toUpperCase().includes('COMP');
    
    switch (step) {
      case 0:
        // Category Selection - must have selected category
        return !!state.selectedCategory;
      
      case 1:
        // Coverage Selection - must have selected subcategory
        return !!state.selectedSubcategory;
      
      case 2: {
        // Vehicle Details - check ALL visible fields from the form based on product type
        const v = state.vehicleDetails || {};
        const p = state.pricingInputs || {};
        
        console.log('🔍 Vehicle validation check:', { 
          vehicleDetails: v, 
          pricingInputs: p, 
          selectedUnderwriter: state.selectedUnderwriter,
          selectedSubcategory: state.selectedSubcategory
        });

        // Check the main fields that are ALWAYS visible in the form
        const hasRegistration = !!(
          v.registrationNumber?.trim() || p.registrationNumber?.trim() ||
          v.Registration_Number?.trim() || p.Registration_Number?.trim() ||
          v.registration_number?.trim() || p.registration_number?.trim()
        );
        const hasFinancialInterest = (
          v.financialInterest === true || v.financialInterest === 'Yes' ||
          p.financialInterest === true || p.financialInterest === 'Yes' ||
          v.Financial_Interest === true || v.Financial_Interest === 'Yes'
        );
        const hasIdentificationType = !!(
          v.identificationType?.trim() || p.identificationType?.trim() ||
          v.Vehicle_Identification_Type?.trim() || p.Vehicle_Identification_Type?.trim()
        );
        const hasCoverDate = !!(
          v.cover_start_date || p.cover_start_date ||
          v.Cover_Start_Date || p.Cover_Start_Date
        );
        
        // Check product-specific required fields
        const productCode = state.selectedSubcategory?.code || state.selectedSubcategory?.subcategory_code || '';
        const categoryCode = state.selectedCategory?.code || '';
        
        // For comprehensive products, sum_insured is NOW entered in Vehicle Details step
        let hasSumInsured = true;
        if (isComp) {
          hasSumInsured = !!(
            v.sum_insured || p.sum_insured ||
            v.Sum_Insured || p.Sum_Insured
          );
        }
        
        // For comprehensive products, also need make, model, and year
        let hasMake = true;
        let hasModel = true;
        let hasYear = true;
        if (isComp) {
          hasMake = !!(
            v.make || p.make ||
            v.Make || p.Make ||
            v.vehicle_make || p.vehicle_make
          );
          hasModel = !!(
            v.model || p.model ||
            v.Model || p.Model ||
            v.vehicle_model || p.vehicle_model ||
            v.model_other || p.model_other  // Support "Others" option
          );
          hasYear = !!(
            v.year || p.year ||
            v.Year || p.Year ||
            v.vehicle_year || p.vehicle_year
          );
        }
        
        // For commercial vehicles, check tonnage
        let hasTonnage = true;
        if (categoryCode === 'COMMERCIAL' || categoryCode === 'COMM') {
          hasTonnage = !!(
            v.tonnage || p.tonnage ||
            v.Tonnage || p.Tonnage
          );
        }
        
        // For PSV/TukTuk, check passenger capacity
        let hasPassengerCapacity = true;
        if (categoryCode === 'PSV' || categoryCode === 'TUKTUK') {
          hasPassengerCapacity = !!(
            v.passengerCapacity || p.passengerCapacity ||
            v.passenger_count || p.passenger_count ||
            v.Passenger_Count || p.Passenger_Count
          );
        }
        
        // For motorcycles, check engine capacity
        let hasEngineCapacity = true;
        if (categoryCode === 'MOTORCYCLE') {
          hasEngineCapacity = !!(
            v.engineCapacity || p.engineCapacity ||
            v.engine_capacity || p.engine_capacity ||
            v.Engine_Capacity || p.Engine_Capacity
          );
        }
        
        // CRITICAL: Must select underwriter (but NOT for Comprehensive - they select later)
        // For Comprehensive products, underwriter selection happens in ComprehensiveOptionsScreen
        const hasUnderwriter = isComp ? true : !!state.selectedUnderwriter;
        
        console.log('📋 Field validation:', {
          hasRegistration, 
          hasFinancialInterest, 
          hasIdentificationType, 
          hasCoverDate, 
          hasSumInsured: isComp ? hasSumInsured : 'N/A (not Comprehensive)',
          hasMake: isComp ? hasMake : 'N/A (not Comprehensive)',
          hasModel: isComp ? hasModel : 'N/A (not Comprehensive)',
          hasYear: isComp ? hasYear : 'N/A (not Comprehensive)',
          hasTonnage: (categoryCode === 'COMMERCIAL' || categoryCode === 'COMM') ? hasTonnage : 'N/A',
          hasPassengerCapacity: (categoryCode === 'PSV' || categoryCode === 'TUKTUK') ? hasPassengerCapacity : 'N/A',
          hasEngineCapacity: categoryCode === 'MOTORCYCLE' ? hasEngineCapacity : 'N/A',
          hasUnderwriter,
          isComprehensive: isComp
        });

        // All required fields must be filled AND underwriter must be selected
        // Note: For Comprehensive, underwriter selection happens in next step
        // Note: sum_insured, make, model, year ARE checked here for Comprehensive (entered in Vehicle Details)
        return hasRegistration && 
               hasFinancialInterest && 
               hasIdentificationType && 
               hasCoverDate && 
               hasSumInsured && 
               hasMake &&
               hasModel &&
               hasYear &&
               hasTonnage && 
               hasPassengerCapacity && 
               hasEngineCapacity && 
               hasUnderwriter;
      }
      
      case 3: {
        // Vehicle Verification Step - auto-pass (verification happens, but user can always continue)
        return true;
      }
      
      case 4: {
        // Documents Step - must upload documents, then allow manual entry/editing
        if (isComp) {
          // For comprehensive, must have selected underwriter
          return !!state.selectedUnderwriter;
        } else {
          // For non-comprehensive, must have uploaded required documents
          // User can then manually enter/edit data even if extraction fails
          const documents = state.pricingInputs?.documents || {};
          
          // Check if documents are uploaded (extraction success not required)
          // Convert documents object to array of uploaded docs
          const uploadedDocs = Object.values(documents).filter(doc => doc && doc.uri);
          const hasDocumentUploads = uploadedDocs.length >= 2;  // At least Logbook + ID
          
          console.log('📄 Document validation:', {
            documentsObject: documents,
            uploadedDocs,
            count: uploadedDocs.length,
            canProceed: hasDocumentUploads
          });
          
          return hasDocumentUploads;
        }
      }
      
      case 5: {
        if (isComp) {
          // For comprehensive flow - Add-ons step (step 5) - optional, always pass
          return true;
        } else {
          // For non-comprehensive flow - client details validation
          const cd = state.pricingInputs?.clientDetails || {};
          
          // Check required fields in clientDetails object
          const hasFirstName = !!(cd.first_name?.trim());
          const hasLastName = !!(cd.last_name?.trim());
          const hasKraPin = !!(cd.kra_pin?.trim());
          const hasIdNumber = !!(cd.id_number?.trim());
          const hasVehicleReg = !!(cd.vehicle_registration?.trim());
          const hasChassis = !!(cd.chassis_number?.trim());
          const hasMake = !!(cd.vehicle_make?.trim());
          
          console.log('📋 Client Details validation:', {
            clientDetails: cd,
            hasFirstName,
            hasLastName,
            hasKraPin,
            hasIdNumber,
            hasVehicleReg,
            hasChassis,
            hasMake,
            allValid: hasFirstName && hasLastName && hasKraPin && hasIdNumber && hasVehicleReg && hasChassis && hasMake
          });
          
          // Required: Name, KRA PIN, ID, Vehicle Registration, Chassis, Make
          return hasFirstName && hasLastName && hasKraPin && hasIdNumber && hasVehicleReg && hasChassis && hasMake;
        }
      }
      
      case 6: {
        if (isComp) {
          // For comprehensive flow - Client Details step (step 6)
          const cd = state.pricingInputs?.clientDetails || {};
          
          // Check required fields - email is ALWAYS required
          // fullName and phone are optional for comprehensive (backend updated)
          const hasEmail = !!(cd.email?.trim());
          
          console.log('📋 Comprehensive Client Details validation:', {
            clientDetails: cd,
            hasEmail,
            note: 'fullName and phone are optional for Comprehensive'
          });
          
          // Only email is required for comprehensive
          return hasEmail;
        } else {
          // For non-comprehensive flow - payment step validation
          const p = state.pricingInputs || {};
          const hasPaymentMethod = !!(p.paymentMethod?.trim());
          return hasPaymentMethod;
        }
      }
      
      case 7:
        if (isComp) {
          // For comprehensive flow - submission step (auto-pass)
          return true;
        } else {
          // Non-comprehensive flow - submission step (auto-pass)
          return true;
        }
      
      default:
        return false; // Default to false for unknown steps
    }
  };

  // Function to get specific validation message for current step
  const getValidationMessage = () => {
    const rawType = state.selectedSubcategory?.coverage_type || state.selectedSubcategory?.type || '';
    const isComp = typeof rawType === 'string' && rawType.toUpperCase().includes('COMP');
    
    switch (step) {
      case 0:
        if (!state.selectedCategory) return "Please select a vehicle category";
        return "";
      
      case 1:
        if (!state.selectedSubcategory) return "Please select a coverage type";
        return "";
      
      case 2: {
        const v = state.vehicleDetails || {};
        const p = state.pricingInputs || {};
        const categoryCode = state.selectedCategory?.code || '';
        
        const hasRegistration = !!(
          v.registrationNumber?.trim() || p.registrationNumber?.trim() ||
          v.Registration_Number?.trim() || p.Registration_Number?.trim() ||
          v.registration_number?.trim() || p.registration_number?.trim()
        );
        const hasFinancialInterest = (
          v.financialInterest === true || v.financialInterest === 'Yes' ||
          p.financialInterest === true || p.financialInterest === 'Yes' ||
          v.Financial_Interest === true || v.Financial_Interest === 'Yes'
        );
        const hasIdentificationType = !!(
          v.identificationType?.trim() || p.identificationType?.trim() ||
          v.Vehicle_Identification_Type?.trim() || p.Vehicle_Identification_Type?.trim()
        );
        const hasCoverDate = !!(
          v.cover_start_date || p.cover_start_date ||
          v.Cover_Start_Date || p.Cover_Start_Date
        );
        
        // Product-specific validations
        const hasSumInsured = !!(v.sum_insured || p.sum_insured || v.Sum_Insured || p.Sum_Insured);
        const hasMake = !!(v.make || p.make || v.Make || p.Make || v.vehicle_make || p.vehicle_make);
        const hasModel = !!(v.model || p.model || v.Model || p.Model || v.vehicle_model || p.vehicle_model || v.model_other || p.model_other);
        const hasYear = !!(v.year || p.year || v.Year || p.Year || v.vehicle_year || p.vehicle_year);
        const hasTonnage = !!(v.tonnage || p.tonnage || v.Tonnage || p.Tonnage);
        const hasPassengerCapacity = !!(
          v.passengerCapacity || p.passengerCapacity ||
          v.passenger_count || p.passenger_count ||
          v.Passenger_Count || p.Passenger_Count
        );
        const hasEngineCapacity = !!(
          v.engineCapacity || p.engineCapacity ||
          v.engine_capacity || p.engine_capacity ||
          v.Engine_Capacity || p.Engine_Capacity
        );
        const hasUnderwriter = !!state.selectedUnderwriter;
        
        // Priority order of validation messages
        if (!hasRegistration) return "Please enter registration number";
        if (!hasFinancialInterest) return "Please select financial interest";
        if (!hasIdentificationType) return "Please select identification type";
        if (!hasCoverDate) return "Please select cover start date";
        
        // Product-specific required fields
        if (isComp && !hasSumInsured) return "Please enter sum insured (vehicle value)";
        if (isComp && !hasMake) return "Please select vehicle make";
        if (isComp && !hasModel) return "Please select vehicle model";
        if (isComp && !hasYear) return "Please enter year of manufacture";
        if ((categoryCode === 'COMMERCIAL' || categoryCode === 'COMM') && !hasTonnage) return "Please enter vehicle tonnage";
        if ((categoryCode === 'PSV' || categoryCode === 'TUKTUK') && !hasPassengerCapacity) return "Please enter passenger capacity";
        if (categoryCode === 'MOTORCYCLE' && !hasEngineCapacity) return "Please enter engine capacity";
        
        if (!hasUnderwriter) return "Please select an underwriter";
        return "";
      }
      
      case 4: {
        if (isComp && !state.selectedUnderwriter) {
          return "Please select an underwriter";
        }
        return "";
      }
      
      case 5: {
        if (!isComp) {
          const cd = state.pricingInputs?.clientDetails || {};
          if (!cd.first_name?.trim()) return "Please enter client first name";
          if (!cd.last_name?.trim()) return "Please enter client last name";
          if (!cd.kra_pin?.trim()) return "Please enter KRA PIN";
          if (!cd.id_number?.trim()) return "Please enter ID number";
          if (!cd.vehicle_registration?.trim()) return "Please enter vehicle registration";
          if (!cd.chassis_number?.trim()) return "Please enter chassis number";
          if (!cd.vehicle_make?.trim()) return "Please enter vehicle make";
        }
        return "";
      }
      
      case 6: {
        const p = state.pricingInputs || {};
        if (!p.paymentMethod?.trim()) return "Please select a payment method";
        return "";
      }
      
      default:
        return "";
    }
  };

  const onNext = async () => {
    // Trigger DMVIC verification when moving from step 2 (Vehicle Details) to step 3 (Verification)
    if (step === 2) {
      try {
        setVerificationStatus('checking');
        const vehicleData = state.vehicleDetails || state.pricingInputs || {};
        const registrationNumber = vehicleData.registrationNumber || vehicleData.vehicle_registration || registration.number;
        
        if (registrationNumber) {
          let response;
          
          // Use simulation or real API based on config
          if (USE_DMVIC_SIMULATION) {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Return simulated response
            response = {
              ...SIMULATED_DMVIC_RESPONSE,
              policy: {
                ...SIMULATED_DMVIC_RESPONSE.policy,
                vehicle_registration: registrationNumber // Use actual registration number
              }
            };
            console.log('🧪 Using DMVIC simulation:', response);
          } else {
            // Call the real vehicle_check API
            response = await djangoAPI.vehicleCheck({
              vehicle_registration: registrationNumber,
              vehicle_make: vehicleData.make || vehicleData.vehicle_make || '',
              vehicle_model: vehicleData.model || vehicleData.vehicle_model || '',
              vehicle_year: vehicleData.year || vehicleData.vehicle_year || new Date().getFullYear().toString()
            });
          }
          
          if (response && response.exists && response.policy) {
            // Existing cover found
            setVerificationStatus('found');
            setExistingCoverData(response);
            console.log('✅ Existing cover found:', response);
          } else {
            // No existing cover
            setVerificationStatus('not_found');
            setExistingCoverData(null);
            console.log('ℹ️ No existing cover found');
          }
        } else {
          // No registration number provided, skip verification
          setVerificationStatus('not_found');
          setExistingCoverData(null);
        }
      } catch (error) {
        // Silently handle DMVIC API errors (endpoint may not be configured)
        console.log('ℹ️ DMVIC verification skipped:', error?.message || 'API not available');
        setVerificationStatus('not_found');
        setExistingCoverData(null);
      }
    }
    
    // If leaving Documents step in non-comprehensive flow, pre-apply extracted data to pricing inputs
    try {
      const rawTypeForNext = state.selectedSubcategory?.coverage_type || state.selectedSubcategory?.type || '';
      const isCompForNext = typeof rawTypeForNext === 'string' && rawTypeForNext.toUpperCase().includes('COMP');
      if (step === 4 && !isCompForNext) {
        const docs = state.extractedDocuments || {};
        const merged = {
          ...(docs.kra_pin || {}),
          ...(docs.id_copy || {}),
          ...(docs.logbook || {}),
        };
        const trim = (v) => (v ?? '').toString().trim();
        const up = (v) => trim(v).toUpperCase();

        const overrides = {};
        if (merged.owner_name) {
          const parts = trim(merged.owner_name).split(/\s+/);
          if (parts[0]) overrides.first_name = parts[0];
          const rest = parts.slice(1).join(' ');
          if (rest) overrides.last_name = rest;
        }
        if (merged.kra_pin) overrides.kra_pin = up(merged.kra_pin);
        if (merged.id_number) overrides.id_number = trim(merged.id_number);
  if (merged.registration_number) overrides.vehicle_registration = up(merged.registration_number);
        if (merged.chassis_number) overrides.chassis_number = up(merged.chassis_number);
        if (merged.make) overrides.vehicle_make = trim(merged.make);
        if (merged.model) overrides.vehicle_model = trim(merged.model);
        if (merged.engine_number) overrides.engine_number = up(merged.engine_number);
  if (merged.email) overrides.email = trim(merged.email);
  if (merged.phone) overrides.phone = trim(merged.phone);

        if (Object.keys(overrides).length > 0) {
          // Update pricing inputs and mirror a simple clientDetails block
          actions.updatePricingInputs({
            ...overrides,
            clientDetails: {
              ...(state.pricingInputs?.clientDetails || {}),
              first_name: overrides.first_name ?? state.pricingInputs?.clientDetails?.first_name,
              last_name: overrides.last_name ?? state.pricingInputs?.clientDetails?.last_name,
              kra_pin: overrides.kra_pin ?? state.pricingInputs?.clientDetails?.kra_pin,
              id_number: overrides.id_number ?? state.pricingInputs?.clientDetails?.id_number,
              email: overrides.email ?? state.pricingInputs?.clientDetails?.email,
              phone: overrides.phone ?? state.pricingInputs?.clientDetails?.phone,
            },
          });

          // Keep vehicleDetails in sync for payment/summary views
          const vehicleOverrides = {};
          if (overrides.vehicle_registration) vehicleOverrides.registrationNumber = overrides.vehicle_registration;
          if (overrides.vehicle_make) vehicleOverrides.make = overrides.vehicle_make;
          if (overrides.vehicle_model) vehicleOverrides.model = overrides.vehicle_model;
          if (overrides.engine_number) vehicleOverrides.engine_number = overrides.engine_number;
          if (Object.keys(vehicleOverrides).length > 0) {
            actions.updateVehicleDetails(vehicleOverrides);
          }
        }
      }
    } catch (e) {
      console.log('Pre-apply extracted data on Next failed:', e?.message || e);
    }

    // SIMULATED PAYMENT PROCESSING (Step 6 → Step 7) - NON-COMPREHENSIVE ONLY
    // Check if this is a Comprehensive product - skip payment simulation if so
    const rawTypePayment = state.selectedSubcategory?.coverage_type || state.selectedSubcategory?.type || '';
    const isComprehensiveProduct = typeof rawTypePayment === 'string' && rawTypePayment.toUpperCase().includes('COMP');
    
    if (step === 6 && !isComprehensiveProduct) {
      console.log('\n' + '='.repeat(80));
      console.log('💳 SIMULATED PAYMENT PROCESSING - onNext called at Step 6');
      console.log('='.repeat(80));
      
      // Detect if extendible product
      const isExtendible = state.selectedSubcategory?.subcategory_code?.includes('EXT') || 
                          state.selectedSubcategory?.is_extendible ||
                          state.selectedUnderwriter?.is_extendible;
      
      // Get extendible config from multiple sources - prioritize underwriter selection
      // Check underwriter first (from compare endpoint), then fallback to other state
      const extendibleConfig = state.selectedUnderwriter?.extendible_config ||
                              state.calculatedPremium?.extendible_config ||
                              state.pricingInputs?.extendible_config;
      
      const paymentPlan = state.pricingInputs?.payment_plan || 'installments';
      
      console.log('🔍 DEBUG - Payment Step State:', {
        isExtendible,
        hasSelectedUnderwriter: !!state.selectedUnderwriter,
        selectedUnderwriterKeys: state.selectedUnderwriter ? Object.keys(state.selectedUnderwriter) : [],
        hasExtendibleConfig: !!extendibleConfig,
        extendibleConfigKeys: extendibleConfig ? Object.keys(extendibleConfig) : [],
        configSource: state.selectedUnderwriter?.extendible_config ? 'underwriter' : 
                     state.calculatedPremium?.extendible_config ? 'calculatedPremium' : 
                     state.pricingInputs?.extendible_config ? 'pricingInputs' : 'NONE',
        extendibleConfigData: extendibleConfig,
        underwriterIsExtendible: state.selectedUnderwriter?.is_extendible,
        underwriterName: state.selectedUnderwriter?.name || state.selectedUnderwriter?.company
      });
      console.log('Extendible Product:', isExtendible);
      console.log('Extendible Config:', JSON.stringify(extendibleConfig, null, 2));
      console.log('Payment Plan:', paymentPlan);
      
      // Calculate amount to pay
      let amountToPay = 0;
      if (isExtendible && extendibleConfig) {
        const fallbackBalance = Math.max(0, (extendibleConfig.total_annual_premium || 0) - (extendibleConfig.initial_amount || 0));
        const balanceAmount = extendibleConfig.balance_amount ?? fallbackBalance;
        if (paymentPlan === 'full') {
          amountToPay = Math.round(extendibleConfig.total_annual_premium * 0.9); // 10% discount
          console.log('Payment Plan: Full Payment (10% discount)');
        } else {
          amountToPay = extendibleConfig.initial_amount || 0;
          console.log('Payment Plan: Installments (Initial payment only)');
        }
        console.log('Initial Amount:', extendibleConfig.initial_amount);
        console.log('Balance Amount:', balanceAmount);
      } else {
        amountToPay = state.selectedUnderwriter?.total_premium || 
                     state.calculatedPremium?.total_amount || 
                     state.calculatedPremium?.total_premium || 0;
        console.log('Payment Plan: Standard (Full payment)');
      }
      
      console.log('Amount to Pay: KSh', amountToPay.toLocaleString());
      console.log('Payment Method:', state.pricingInputs?.paymentMethod || 'MPESA');
      
      // Calculate balance for display in alert
      const balanceAmount = extendibleConfig?.balance_amount ?? 
                           Math.max(0, (extendibleConfig?.total_annual_premium || 0) - (extendibleConfig?.initial_amount || 0));
      const deadlineDays = extendibleConfig?.extension_deadline_days || extendibleConfig?.due_days || 30;
      
      console.log('🔢 Payment Alert Calculations:', {
        isExtendible,
        paymentPlan,
        willShowBalance: isExtendible && paymentPlan === 'installments',
        balanceAmount,
        deadlineDays,
        configPresent: !!extendibleConfig
      });
      
      console.log('🚨 SHOWING ALERT DIALOG - User must confirm payment simulation');
      console.log('='.repeat(80));
      
      // Simulate payment delay
      Alert.alert(
        '💳 Simulated Payment',
        `Processing payment of KSh ${amountToPay.toLocaleString()} via ${state.pricingInputs?.paymentMethod || 'M-PESA'}...\n\n` +
        (isExtendible && paymentPlan === 'installments' 
          ? `This is the initial payment. Balance of KSh ${balanceAmount.toLocaleString()} due in ${deadlineDays} days.`
          : 'Full payment for entire coverage period.'),
        [
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: () => {
              console.log('❌ User cancelled payment simulation');
              console.log('Staying at Step 6 (Payment)\n');
            }
          },
          {
            text: 'Simulate Success',
            onPress: async () => {
              console.log('\n' + '='.repeat(80));
              console.log('✅ Payment simulation: SUCCESS');
              console.log('Transaction ID: SIM-' + Date.now());
              console.log('Updating state with payment confirmation...');
              
              // Store payment confirmation AND extendible config in state
              actions.updatePricingInputs({
                paymentStatus: 'CONFIRMED',
                paymentAmount: amountToPay,
                transactionId: `SIM-${Date.now()}`,
                paymentDate: new Date().toISOString(),
                // Store extendible config for later use
                ...(extendibleConfig && { extendible_config: extendibleConfig })
              });
              
              console.log('Payment confirmation stored in state');
              console.log('Advancing to Step 7 (Submission)...');
              console.log('='.repeat(80) + '\n');
              
              // Proceed to submission
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setStep(7);
            }
          }
        ]
      );
      
      // Don't auto-proceed - wait for user confirmation
      console.log('⏸️  onNext handler paused - waiting for Alert dialog response');
      console.log('='.repeat(80) + '\n');
      return;
    }

    if (canProceed()) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      
      // Skip Vehicle Verification (step 3) for Comprehensive products
      const rawType = state.selectedSubcategory?.coverage_type || state.selectedSubcategory?.type || '';
      const isComp = typeof rawType === 'string' && rawType.toUpperCase().includes('COMP');
      
      if (step === 2 && isComp) {
        // Skip from Vehicle Details (step 2) directly to Comprehensive Options (step 4)
        console.log('⏭️  Skipping Vehicle Verification for Comprehensive product');
        setStep(4);
      } else {
        setStep((s) => Math.min(s + 1, steps.length - 1));
      }
    }
  };

  const onBack = () => {
    if (step > 0) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      
      const rawType = state.selectedSubcategory?.coverage_type || state.selectedSubcategory?.type || '';
      const isComp = typeof rawType === 'string' && rawType.toUpperCase().includes('COMP');
      
      // Skip step 3 (Vehicle Verification) when going back if:
      // 1. No existing cover found, OR
      // 2. Comprehensive product (doesn't use verification)
      if (step === 4 && (isComp || verificationStatus === 'not_found' || !existingCoverData)) {
        // Skip step 3 and go directly to step 2 (Vehicle Details)
        console.log('⏮️  Skipping Vehicle Verification step (going back)');
        setStep(2);
      } else {
        setStep((s) => Math.max(s - 1, 0));
      }
    } else {
      // If on first step, go back to home
      navigateToHome();
    }
  };
  
  // Navigation to home (back navigation removed per user request)
  const navigateToHome = () => {
    navigation.navigate('MainTabs', { screen: 'Home' });
  };

  // Memoize frequently rebuilt prop objects to avoid child effect loops
  const selectedProductMemo = useMemo(() => {
    if (!state.selectedSubcategory) return null;
    const sub = state.selectedSubcategory;
    const coverage = sub.type ? String(sub.type).toLowerCase() : undefined;
    
    // Map code to display name for better UX
    const getDisplayName = (code) => {
      const displayNames = {
        'PRIVATE_THIRD_PARTY': 'Private Third-Party',
        'PRIVATE_TP_EXT': 'Private Third-Party Extendible', 
        'PRIVATE_COMPREHENSIVE': 'Private Comprehensive',
        'PRIVATE_TOR': 'Private TOR',
        'COMMERCIAL_THIRD_PARTY': 'Commercial Third-Party',
        'COMMERCIAL_COMPREHENSIVE': 'Commercial Comprehensive',
        'PSV_THIRD_PARTY': 'PSV Third-Party',
        'PSV_COMPREHENSIVE': 'PSV Comprehensive',
        'MOTORCYCLE_THIRD_PARTY': 'Motorcycle Third-Party',
        'MOTORCYCLE_COMPREHENSIVE': 'Motorcycle Comprehensive',
        'TUKTUK_THIRD_PARTY': 'TukTuk Third-Party',
        'TUKTUK_COMPREHENSIVE': 'TukTuk Comprehensive'
      };
      return displayNames[code] || code;
    };
    
    return {
      id: sub.id,
      name: sub.label || getDisplayName(sub.code) || sub.name || sub.code,
      category: state.selectedCategory?.key,
      category_code: state.selectedCategory?.category_code || state.selectedCategory?.key,
      coverage_type: coverage,
      subcategory_code: sub.subcategory_code || sub.code,
      code: sub.code,
      type: sub.type,
    };
  }, [
    state.selectedSubcategory?.id,
    state.selectedSubcategory?.name,
    state.selectedSubcategory?.type,
    state.selectedSubcategory?.subcategory_code,
    state.selectedSubcategory?.code,
    state.selectedCategory?.key,
    state.selectedCategory?.category_code,
  ]);

  const vehicleDataMemo = useMemo(() => {
    // Use "other" values when "Others" is selected
    const effectiveMake = state.vehicleDetails.make === 'Others' 
      ? state.vehicleDetails.make_other 
      : state.vehicleDetails.make;
    
    const effectiveModel = state.vehicleDetails.model === 'Others'
      ? state.vehicleDetails.model_other
      : state.vehicleDetails.model;
    
    return {
      // Prefer values from vehicleDetails, but fall back to clientDetails/pricingInputs when absent
      registration:
        state.vehicleDetails.registrationNumber ||
        state.vehicleDetails.registration ||
        state.pricingInputs?.clientDetails?.vehicle_registration ||
        state.pricingInputs?.registration ||
        state.pricingInputs?.vehicle_registration,
      make:
        effectiveMake ||
        state.pricingInputs?.clientDetails?.vehicle_make ||
        state.pricingInputs?.make,
      model:
        effectiveModel ||
        state.pricingInputs?.clientDetails?.vehicle_model ||
        state.pricingInputs?.model,
      year:
        state.vehicleDetails.year ||
        state.pricingInputs?.clientDetails?.vehicle_year ||
        state.pricingInputs?.year,
      sum_insured: state.vehicleDetails.sum_insured || state.pricingInputs.sumInsured,
      // Add-on value fields for comprehensive coverage
      windscreen_value: state.vehicleDetails.windscreen_value,
      radio_cassette_value: state.vehicleDetails.radio_cassette_value,
      vehicle_accessories_value: state.vehicleDetails.vehicle_accessories_value,
      // Spread last to keep any additional fields available to consumers
      ...state.vehicleDetails,
    };
  }, [
    state.vehicleDetails.registrationNumber,
    state.vehicleDetails.registration,
    state.vehicleDetails.make,
    state.vehicleDetails.make_other,
    state.vehicleDetails.model,
    state.vehicleDetails.model_other,
    state.vehicleDetails.year,
    state.vehicleDetails.sum_insured,
    state.vehicleDetails.windscreen_value,
    state.vehicleDetails.radio_cassette_value,
    state.vehicleDetails.vehicle_accessories_value,
    state.pricingInputs?.sumInsured,
    state.pricingInputs?.clientDetails?.vehicle_registration,
    state.pricingInputs?.clientDetails?.vehicle_make,
    state.pricingInputs?.clientDetails?.vehicle_model,
    state.pricingInputs?.clientDetails?.vehicle_year,
    state.pricingInputs?.registration,
    state.pricingInputs?.vehicle_registration,
    state.pricingInputs?.make,
    state.pricingInputs?.model,
    state.pricingInputs?.year,
  ]);

  // Render different steps based on current step index
  const renderContent = () => {
    // Consolidated product and coverage type calculations (moved to top)
    const selectedProduct = state.selectedSubcategory;
    const rawTypeRC = selectedProduct?.coverage_type ?? selectedProduct?.type ?? '';
    const normRC = typeof rawTypeRC === 'string' ? rawTypeRC.toUpperCase().trim() : '';
    const isComprehensive = normRC === 'COMPREHENSIVE' || normRC === 'COMP' || normRC.includes('COMPREHENSIVE');
    
    // Determine submission step index based on flow
    const submissionStepIndex = isComprehensive ? 7 : 7;
    
    // Priority: Render submission step first to prevent flash of earlier steps
    if (step === submissionStepIndex) {
      // Extract client details with fallbacks
      const clientDetails = {
        full_name: state.pricingInputs?.full_name 
          || state.pricingInputs?.clientDetails?.full_name 
          || state.pricingInputs?.clientName
          || '',
        email: state.pricingInputs?.email 
          || state.pricingInputs?.clientDetails?.email 
          || state.pricingInputs?.clientEmail
          || '',
        phone_number: state.pricingInputs?.phone_number 
          || state.pricingInputs?.clientDetails?.phone_number 
          || state.pricingInputs?.clientPhone
          || '',
        id_number: state.pricingInputs?.id_number 
          || state.pricingInputs?.clientDetails?.id_number 
          || state.pricingInputs?.clientId
          || '',
        kra_pin: state.pricingInputs?.kra_pin 
          || state.pricingInputs?.clientDetails?.kra_pin 
          || '',
      };

      // Extract vehicle details with fallbacks
      const vehicleDetails = {
        registration: state.pricingInputs?.registration 
          || state.pricingInputs?.vehicle_registration 
          || state.pricingInputs?.vehicleDetails?.registration
          || '',
        make: state.pricingInputs?.make 
          || state.pricingInputs?.vehicle_make 
          || state.pricingInputs?.clientDetails?.vehicle_make
          || state.pricingInputs?.vehicleDetails?.make
          || '',
        model: state.pricingInputs?.model 
          || state.pricingInputs?.vehicle_model 
          || state.pricingInputs?.clientDetails?.vehicle_model
          || state.pricingInputs?.vehicleDetails?.model
          || '',
        year: state.pricingInputs?.year 
          || state.pricingInputs?.vehicle_year 
          || state.pricingInputs?.clientDetails?.vehicle_year
          || state.pricingInputs?.vehicleDetails?.year
          || '',
        engine_number: state.pricingInputs?.engine_number 
          || state.pricingInputs?.vehicleDetails?.engine_number 
          || '',
        chassis_number: state.pricingInputs?.chassis_number 
          || state.pricingInputs?.vehicleDetails?.chassis_number 
          || '',
        color: state.pricingInputs?.color 
          || state.pricingInputs?.vehicleDetails?.color 
          || '',
        seating_capacity: state.pricingInputs?.seating_capacity 
          || state.pricingInputs?.vehicleDetails?.seating_capacity 
          || 0,
      };

      // Get selected pricing (underwriter) from state
      const selectedPricing = state.selectedUnderwriter || state.selectedPricing || {};
      const subcategory = state.selectedSubcategory || {};

      // Prepare product details
      const productDetails = {
        category: state.selectedCategory?.name || state.selectedCategory?.category_name || '',
        categoryCode: state.selectedCategory?.category_code || state.selectedCategory?.key || '',
        subcategory: subcategory.name || subcategory.subcategory_name || '',
        subcategoryCode: subcategory.subcategory_code || subcategory.key || '',
        coverageType: subcategory.coverage_type || subcategory.type || subcategory.cover_type || '',
        pricingModel: subcategory.pricing_model || '',
        is_extendible: selectedPricing.is_extendible || false,
        payment_plan: selectedPricing.payment_plan || 'FULL',
      };

      // Extract and validate extendible config if product is extendible
      let extendibleConfig = null;
      
      if (selectedPricing.is_extendible) {
        const rawConfig = selectedPricing.extendible_config;
        
        // Validate that extendible config exists
        if (!rawConfig) {
          console.error('[MotorInsuranceScreen] ❌ CRITICAL: Extendible product missing extendible_config!');
          console.error('[MotorInsuranceScreen] Product:', subcategory);
          console.error('[MotorInsuranceScreen] Pricing:', selectedPricing);
          
          Alert.alert(
            'Configuration Error',
            'This extendible product is missing payment configuration. Please contact support or select a different product.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        // Map to standardized field names (backend expects these exact fields)
        extendibleConfig = {
          initial_period_days: rawConfig.initial_period_days || rawConfig.due_days || 30,
          extension_deadline_days: rawConfig.extension_deadline_days || rawConfig.grace_period_days || 60,
          initial_amount: Number(rawConfig.initial_amount || 0),
          balance_amount: Number(rawConfig.balance_amount || 0),
          total_annual_premium: Number(rawConfig.total_annual_premium || selectedPricing.total_premium || 0)
        };
        
        // Validate all required fields are present and valid
        const validationErrors = [];
        if (!extendibleConfig.initial_period_days || extendibleConfig.initial_period_days <= 0) {
          validationErrors.push('initial_period_days must be positive');
        }
        if (!extendibleConfig.extension_deadline_days || extendibleConfig.extension_deadline_days <= 0) {
          validationErrors.push('extension_deadline_days must be positive');
        }
        if (!extendibleConfig.initial_amount || extendibleConfig.initial_amount <= 0) {
          validationErrors.push('initial_amount must be positive');
        }
        if (!extendibleConfig.balance_amount || extendibleConfig.balance_amount <= 0) {
          validationErrors.push('balance_amount must be positive');
        }
        if (!extendibleConfig.total_annual_premium || extendibleConfig.total_annual_premium <= 0) {
          validationErrors.push('total_annual_premium must be positive');
        }
        
        if (validationErrors.length > 0) {
          console.error('[MotorInsuranceScreen] ❌ CRITICAL: Extendible config validation failed!');
          console.error('[MotorInsuranceScreen] Errors:', validationErrors);
          console.error('[MotorInsuranceScreen] Config:', extendibleConfig);
          
          Alert.alert(
            'Configuration Error',
            `Extendible payment configuration is invalid:\n- ${validationErrors.join('\n- ')}\n\nPlease recalculate the premium or contact support.`,
            [{ text: 'OK' }]
          );
          return;
        }
        
        console.log('[MotorInsuranceScreen] ✅ Extendible config validated:', extendibleConfig);
      }

      // Prepare premium breakdown with levy calculation fallback
      const basePremium = Number(selectedPricing.basic_premium || selectedPricing.base_premium || 0);
      
      // Calculate levies if not provided by backend (fallback to ensure never zero)
      const itlLevy = Number(selectedPricing.itl || selectedPricing.training_levy || 0) || 
        Math.round(basePremium * 0.0025 * 100) / 100; // 0.25% of base premium
      const pcfLevy = Number(selectedPricing.pcf || selectedPricing.pcf_levy || 0) || 
        Math.round(basePremium * 0.0025 * 100) / 100; // 0.25% of base premium
      const stampDuty = Number(selectedPricing.stamp_duty || 0) || 40; // KES 40 fixed
      
      // Recalculate total if levies were missing
      const calculatedTotal = basePremium + itlLevy + pcfLevy + stampDuty;
      const totalPremium = Number(selectedPricing.total_premium || 0) || calculatedTotal;
      
      const premiumBreakdown = {
        basic_premium: basePremium,
        itl: itlLevy,
        pcf: pcfLevy,
        stamp_duty: stampDuty,
        total_premium: totalPremium,
        underwriter_name: selectedPricing.underwriter_name || selectedPricing.underwriter?.name || '',
        underwriter_id: selectedPricing.underwriter_id || selectedPricing.underwriter?.id || '',
        // CRITICAL: Include extendible_config for extendible products
        ...(extendibleConfig && { extendible_config: extendibleConfig }),
      };

      // Prepare payment details
      const paymentDetails = {
        method: state.paymentMethod || 'mpesa',
        status: 'CONFIRMED',
        amount: extendibleConfig 
          ? extendibleConfig.initial_amount
          : totalPremium,
        transaction_id: state.pricingInputs?.transactionId || state.transactionId || `TXN-${Date.now()}`,
        payment_date: new Date().toISOString(),
      };

      // Assemble complete policy data
      const policyData = {
        quoteId: state.quoteId || `QUOTE-${Date.now()}`,
        clientDetails,
        vehicleDetails,
        productDetails,
        
        // Add comprehensive underwriter details
        underwriterDetails: state.selectedUnderwriter ? {
          id: state.selectedUnderwriter.underwriter_id || state.selectedUnderwriter.id,
          name: state.selectedUnderwriter.underwriter_name || state.selectedUnderwriter.name,
          company: state.selectedUnderwriter.company || state.selectedUnderwriter.underwriter_name,
          total_premium: state.selectedUnderwriter.total_premium,
          breakdown: state.selectedUnderwriter.breakdown,
          is_extendible: state.selectedUnderwriter.is_extendible,
          extendible_config: state.selectedUnderwriter.extendible_config
        } : null,
        
        extendibleConfig,
        premiumBreakdown,
        paymentDetails,
        agent_id: state.agentId || 'AGENT-DEFAULT',
      };

      console.log('Step 7/8: Rendering submission with data:', policyData);

      // For Comprehensive: Create draft quote instead of policy
      if (isComprehensive) {
        return (
          <View style={styles.stepContainer}>
            <View style={styles.submissionContainer}>
              <ActivityIndicator size="large" color="#D5222B" />
              <Text style={styles.submissionText}>Saving your quote...</Text>
            </View>
          </View>
        );
      }

      // For Non-Comprehensive: Create policy directly
      return (
        <PolicySubmission
          policyData={policyData}
          onSubmissionComplete={(result) => {
            console.log('Policy submission complete:', result);
            
            // Navigate to success screen with policy details
            try {
              navigation.replace('PolicySuccess', {
                policyNumber: result.policyNumber || result.policy_number || '',
                policyId: result.id || result.policyId || '',
                clientName: clientDetails.full_name,
                vehicleReg: vehicleDetails.registration,
                totalPremium: premiumBreakdown.total_premium,
                coverageType: productDetails.coverageType,
                underwriterName: premiumBreakdown.underwriter_name,
                isExtendible: productDetails.is_extendible,
                extendibleConfig,
                status: result.status || 'ACTIVE',
              });
            } catch (navError) {
              console.error('Navigation error after submission:', navError);
              Alert.alert(
                'Success',
                `Policy ${result.policyNumber || result.policy_number} created successfully!`,
                [{ text: 'OK', onPress: () => navigation.navigate('Quotations') }]
              );
            }
          }}
          onError={(error) => {
            console.error('Policy submission error:', error);
            Alert.alert(
              'Submission Error',
              error.message || 'Failed to create policy. Please try again.',
              [
                { text: 'Retry', onPress: () => setStep(isComprehensive ? 7 : 6) },
                { text: 'Cancel', onPress: () => navigation.goBack() }
              ]
            );
          }}
        />
      );
    }
    
    // Step 0: Category Selection
    if (step === 0) {
      return (
        <View style={styles.stepContainer}>
          <MotorCategoryGrid
            categories={categories}
            selectedCategory={state.selectedCategory}
            loading={categoriesLoading}
            error={categoriesError}
            onSelect={async (category) => {
              console.log('Selected category:', category);
              const categoryCode = category.category_code || category.key;
              let subcategories = [];
              try {
                const list = await djangoAPI.getSubcategories(categoryCode);
                const normalized = (Array.isArray(list) ? list : []).map((sub) => {
                  const type = String(sub.cover_type || sub.product_type || sub.pricing_model || '').toUpperCase();
                  const rawReq = sub.pricing_requirements || sub.required_fields || [];
                  const reqArr = Array.isArray(rawReq) ? rawReq : Object.values(rawReq || {});
                  return {
                    id: sub.id,
                    code: sub.subcategory_code || sub.code,
                    subcategory_code: sub.subcategory_code || sub.code,
                    name: sub.subcategory_name || sub.name,
                    type,
                    description: sub.description,
                    requirements: reqArr,
                    is_extendible: Boolean(sub.is_extendible),
                    extendible_variant_id: sub.extendible_variant_id || sub.extendible_variant || null,
                    additionalFields: sub.additional_fields || sub.additionalFields || [],
                    fieldValidations: sub.field_validations || sub.fieldValidations || {},
                    complex: (sub.pricing_model && sub.pricing_model !== 'FIXED') || reqArr.length > 0,
                    raw: sub,
                  };
                });
                // Day 13: Sort subcategories with TOR positioning
                // TOR=1, Third Party=2, Third Party Extendible=3, Comprehensive=4, Others=5
                subcategories = normalized.sort((a, b) => {
                  const getPriority = (sub) => {
                    const nameUpper = (sub.name || '').toUpperCase();
                    const typeUpper = (sub.type || '').toUpperCase();
                    const combined = `${nameUpper} ${typeUpper}`;
                    
                    if (combined.includes('TOR') || typeUpper === 'TOR') return 1;
                    if (combined.includes('THIRD PARTY EXTENDIBLE') || combined.includes('THIRD-PARTY EXTENDIBLE')) return 3;
                    if (combined.includes('THIRD PARTY') || combined.includes('THIRD-PARTY') || typeUpper.includes('TPO')) return 2;
                    if (combined.includes('COMPREHENSIVE') || typeUpper.includes('COMP')) return 4;
                    return 5; // Others
                  };
                  
                  const priorityA = getPriority(a);
                  const priorityB = getPriority(b);
                  
                  if (priorityA !== priorityB) {
                    return priorityA - priorityB;
                  }
                  
                  // If same priority, sort alphabetically
                  return a.name.localeCompare(b.name);
                });
              } catch (err) {
                console.warn('Failed to load cover types from backend, using fallback:', err?.message || err);
                const fallbackSubs = getCoverTypesByCategory(categoryCode);
                // Day 13: Sort fallback subcategories with TOR positioning
                subcategories = fallbackSubs.sort((a, b) => {
                  const getPriority = (sub) => {
                    const nameUpper = (sub.name || '').toUpperCase();
                    const typeUpper = (sub.type || '').toUpperCase();
                    const combined = `${nameUpper} ${typeUpper}`;
                    
                    if (combined.includes('TOR') || typeUpper === 'TOR') return 1;
                    if (combined.includes('THIRD PARTY EXTENDIBLE') || combined.includes('THIRD-PARTY EXTENDIBLE')) return 3;
                    if (combined.includes('THIRD PARTY') || combined.includes('THIRD-PARTY') || typeUpper.includes('TPO')) return 2;
                    if (combined.includes('COMPREHENSIVE') || typeUpper.includes('COMP')) return 4;
                    return 5;
                  };
                  
                  const priorityA = getPriority(a);
                  const priorityB = getPriority(b);
                  
                  if (priorityA !== priorityB) {
                    return priorityA - priorityB;
                  }
                  
                  return a.name.localeCompare(b.name);
                });
              }
              const catWithSubs = { ...category, subcategories };
              actions.setCategorySelection({
                category: catWithSubs,
                subcategory: null,
                productType: null,
              });
              setStep(1);
            }}
            bottomPadding={insets.bottom + 96}
          />
          
          {/* Check Policy Button - positioned between category grid and navigation */}
          <View style={styles.checkPolicyContainer}>
            <TouchableOpacity
              style={[styles.checkPolicyButton, verificationStatus === 'checking' && { opacity: 0.6 }]}
              onPress={() => {
                setCheckPolicyInput((registration.number || '').toUpperCase());
                setShowCheckPolicyModal(true);
              }}
              disabled={verificationStatus === 'checking'}
            >
              <View style={styles.checkPolicyButtonContent}>
                <Ionicons name="car-outline" size={26} color="#FFFFFF" />
                <Text style={styles.checkPolicyButtonText}>
                  {verificationStatus === 'checking' ? 'Checking Policy...' : 'Check Vehicle For Existing Cover'}
                </Text>
              </View>
            </TouchableOpacity>
            
            {/* Show status if there's a result */}
            {verificationStatus === 'found' && (
              <Text style={styles.verificationFound}>✅ Active policy found</Text>
            )}
            {verificationStatus === 'not_found' && (
              <Text style={styles.verificationNotFound}>❌ No active policy found</Text>
            )}
            
            {/* Registration input modal (Android/iOS compatible) */}
            <Modal
              visible={showCheckPolicyModal}
              transparent
              animationType="slide"
              onRequestClose={() => setShowCheckPolicyModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                  <Text style={styles.modalTitle}>Check Vehicle For Existing Cover</Text>
                  <Text style={styles.modalSubtitle}>Enter vehicle registration number</Text>
                  <View style={styles.modalInputRow}>
                    <Ionicons name="car-sport" size={20} color="#D5222B" />
                    <TextInput
                      style={styles.modalTextInput}
                      value={checkPolicyInput}
                      onChangeText={(t) => setCheckPolicyInput(t.toUpperCase())}
                      autoCapitalize="characters"
                      placeholder="e.g., KDA 123A"
                    />
                  </View>
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalCancel]}
                      onPress={() => setShowCheckPolicyModal(false)}
                    >
                      <Text style={styles.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalConfirm, (!checkPolicyInput || verificationStatus === 'checking') && { opacity: 0.6 }]}
                      disabled={!checkPolicyInput || verificationStatus === 'checking'}
                      onPress={async () => {
                        const trimmed = (checkPolicyInput || '').trim().toUpperCase();
                        if (!trimmed) return;
                        setRegistration(prev => ({ ...prev, number: trimmed }));
                        setShowCheckPolicyModal(false);
                        await verifyExistingPolicy();
                      }}
                    >
                      {verificationStatus === 'checking' ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.modalConfirmText}>Check</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </View>
        </View>
      );
    }
    
    // Step 1: Subcategory Selection - Load from backend
    if (step === 1 && state.selectedCategory) {
      if (subcategoriesLoading) {
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Loading Coverage Types</Text>
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading subcategories from backend...</Text>
            </View>
          </View>
        );
      }

      if (subcategoriesError) {
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Error Loading Coverage Types</Text>
            <View style={styles.errorContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorTitle}>Failed to Load Subcategories</Text>
              <Text style={styles.errorText}>{subcategoriesError}</Text>
            </View>
          </View>
        );
      }

      const subcategoriesToShow = subcategories.length > 0 
        ? subcategories 
        : getCoverTypesByCategory(state.selectedCategory.key); // Legacy fallback (should be rare)

      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Coverage Type Selection</Text>
          <Text style={styles.stepSubtitle}>Choose coverage for {state.selectedCategory.title}</Text>
          <MotorSubcategoryList
            items={subcategoriesToShow}
            onSelect={(subcategory) => {
              console.log('Selected subcategory:', subcategory);
              actions.setCategorySelection({
                category: state.selectedCategory,
                subcategory,
                productType: subcategory.type,
              });
              setStep(2);
            }}
            bottomPadding={insets.bottom + 96}
          />
        </View>
      );
    }

    // Step 2: Vehicle Details
    if (step === 2) {
      if (!state.selectedSubcategory) {
        setStep(1);
        return null;
      }
      
      return (
        <View style={styles.stepContainer}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepTitle}>Policy Details</Text>
          </View>
          <DynamicPolicyForm
            selectedProduct={selectedProductMemo}
            productType={state.selectedSubcategory?.type}
            initialData={{
              ...state.vehicleDetails,
              ...state.pricingInputs,
              // Include extracted data from documents if available
              ...extractedData.logbook,
              ...extractedData.id_copy,
              ...extractedData.kra_pin
            }}
            values={state.vehicleDetails || state.pricingInputs}
            onChange={(data) => {
              console.log('Vehicle details updated:', data);
              actions.updateVehicleDetails && actions.updateVehicleDetails(data);
              actions.updatePricingInputs(data);
            }}
            errors={state.errors || {}}
            onUnderwriterComparison={(comparisonData) => {
              console.log('Underwriter comparison data:', comparisonData);
              actions.setUnderwriterComparisons && actions.setUnderwriterComparisons(comparisonData);
            }}
            onUnderwriterSelection={(underwriter) => {
              console.log('Underwriter selected from form:', underwriter);
              actions.setSelectedUnderwriter && actions.setSelectedUnderwriter(underwriter);
            }}
          />
        </View>
      );
    }

    // Step 3: Vehicle Verification (DMVIC Check for Existing Cover)
    if (step === 3) {
      if (!state.selectedSubcategory) {
        setStep(1);
        return null;
      }

      // If existing cover found, show full screen with details + client data source selection
      if (verificationStatus === 'found' && existingCoverData) {
        const policy = existingCoverData.policy || {};
        
        return (
          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={styles.existingCoverContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Client Details Data Source Selection - Top Section */}
            <View style={styles.clientDataSourceSection}>
              <Text style={styles.sectionTitle}>Client Details</Text>
              <Text style={styles.sectionSubtitle}>Client Details as Per</Text>
              
              {/* Simple Card-style Radio Selection (matching Step 3 subcategory cards) */}
              <View style={styles.simpleRadioContainer}>
                <TouchableOpacity 
                  style={[
                    styles.simpleRadioCard,
                    clientDataSource === 'logbook' && styles.simpleRadioCardSelected
                  ]}
                  onPress={() => setClientDataSource('logbook')}
                  activeOpacity={0.7}
                >
                  <View style={styles.simpleRadioLeft}>
                    <View style={[
                      styles.simpleRadioCircle,
                      clientDataSource === 'logbook' && styles.simpleRadioCircleSelected
                    ]}>
                      {clientDataSource === 'logbook' && (
                        <View style={styles.simpleRadioCircleInner} />
                      )}
                    </View>
                    <Text style={[
                      styles.simpleRadioLabel,
                      clientDataSource === 'logbook' && styles.simpleRadioLabelSelected
                    ]}>Logbook</Text>
                  </View>
                  {state.extractedDocuments?.logbook && (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[
                    styles.simpleRadioCard,
                    clientDataSource === 'national_id' && styles.simpleRadioCardSelected
                  ]}
                  onPress={() => setClientDataSource('national_id')}
                  activeOpacity={0.7}
                >
                  <View style={styles.simpleRadioLeft}>
                    <View style={[
                      styles.simpleRadioCircle,
                      clientDataSource === 'national_id' && styles.simpleRadioCircleSelected
                    ]}>
                      {clientDataSource === 'national_id' && (
                        <View style={styles.simpleRadioCircleInner} />
                      )}
                    </View>
                    <Text style={[
                      styles.simpleRadioLabel,
                      clientDataSource === 'national_id' && styles.simpleRadioLabelSelected
                    ]}>National ID</Text>
                  </View>
                  {state.extractedDocuments?.kra_pin && (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  )}
                </TouchableOpacity>
              </View>

              <Text style={[styles.sectionTitle, styles.marginTopMd]}>Vehicle Details as Per</Text>
              <TouchableOpacity 
                style={styles.simpleVehicleCard}
                activeOpacity={1}
              >
                <View style={styles.simpleRadioLeft}>
                  <Ionicons name="document-text" size={20} color={Colors.primary} style={{ marginRight: Spacing.sm }} />
                  <Text style={styles.simpleVehicleLabel}>Logbook</Text>
                </View>
                {state.extractedDocuments?.logbook && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                )}
              </TouchableOpacity>
            </View>

            {/* Bottom Drawer Modal for Existing Cover Details */}
            <Modal
              animationType="slide"
              transparent={true}
              visible={existingCoverDrawerVisible}
              onRequestClose={() => setExistingCoverDrawerVisible(false)}
            >
              <TouchableOpacity 
                style={styles.drawerBackdrop}
                activeOpacity={1}
                onPress={() => setExistingCoverDrawerVisible(false)}
              >
                <View style={styles.drawerContainer}>
                  <TouchableOpacity 
                    activeOpacity={1} 
                    onPress={(e) => e.stopPropagation()}
                    style={styles.drawerContent}
                  >
                    {/* Drawer Handle */}
                    <View style={styles.drawerHandle} />

                    {/* Drawer Header */}
                    <View style={styles.drawerHeader}>
                      <View style={styles.drawerShieldIcon}>
                        <Ionicons name="shield-checkmark-outline" size={32} color={Colors.text} />
                      </View>
                      <Text style={styles.drawerTitle}>Vehicle Has Existing Cover</Text>
                      <TouchableOpacity
                        onPress={() => setExistingCoverDrawerVisible(false)}
                        style={styles.drawerCloseButton}
                      >
                        <Ionicons name="close" size={24} color={Colors.textSecondary} />
                      </TouchableOpacity>
                    </View>

                    {/* Info Message */}
                    <View style={styles.drawerInfoBox}>
                      <Ionicons name="information-circle" size={20} color={Colors.primary} />
                      <Text style={styles.drawerInfoText}>
                        Please adjust the start date of the new policy to begin after the existing cover expires
                      </Text>
                    </View>

                    {/* Policy Details Card */}
                    <ScrollView style={styles.drawerScrollContent} showsVerticalScrollIndicator={false}>
                      <View style={styles.drawerDetailsCard}>
                        <View style={styles.drawerDetailItem}>
                          <Text style={styles.drawerDetailLabel}>Vehicle Registration</Text>
                          <Text style={styles.drawerDetailValue}>
                            {policy.vehicle_registration || 'N/A'}
                          </Text>
                        </View>

                        <View style={styles.drawerDetailItem}>
                          <Text style={styles.drawerDetailLabel}>Active Certificate Number</Text>
                          <Text style={styles.drawerDetailValue}>
                            {policy.certificate_number || policy.policy_number || 'N/A'}
                          </Text>
                        </View>

                        <View style={styles.drawerDetailItem}>
                          <Text style={styles.drawerDetailLabel}>Issued By</Text>
                          <Text style={styles.drawerDetailValue}>
                            {policy.insurer || 'N/A'}
                          </Text>
                        </View>

                        <View style={[styles.drawerDetailItem, styles.drawerDetailItemLast]}>
                          <Text style={styles.drawerDetailLabel}>Expiry Date</Text>
                          <Text style={styles.drawerDetailValue}>
                            {policy.expiry_date || 'N/A'}
                          </Text>
                        </View>
                      </View>
                    </ScrollView>

                    {/* Action Buttons */}
                    <View style={styles.drawerActions}>
                      <TouchableOpacity
                        style={styles.drawerAdjustButton}
                        onPress={() => {
                          setExistingCoverDrawerVisible(false);
                          setVerificationStatus(null);
                          setExistingCoverData(null);
                          setStep(2); // Go back to Policy Details
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.drawerAdjustButtonText}>Adjust Start Date</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.drawerSubmitButton}
                        onPress={() => {
                          setExistingCoverDrawerVisible(false);
                          console.log('📝 Debit note will be prepared for policy overlap');
                          setStep(4); // Continue to next step
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.drawerSubmitButtonText}>Submit Debit Note</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>
          </ScrollView>
        );
      }

      // If no existing cover found or check not performed, auto-skip to next step
      if (verificationStatus === 'not_found' || (!existingCoverData && verificationStatus !== 'checking')) {
        setTimeout(() => setStep(4), 100);
      }

      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Verifying Vehicle...</Text>
          <Text style={styles.stepSubtitle}>Checking for existing cover...</Text>
        </View>
      );
    }

    // Step 4: Underwriter Selection (comprehensive) or Documents Upload (non-comprehensive)
    if (step === 4) {
      if (!state.selectedSubcategory) {
        setStep(1);
        return null;
      }
      // Decide path based on comprehensive status
      if (isComprehensive) {
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Underwriter Selection</Text>
            <UnderwriterSelectionStep
              vehicleData={vehicleDataMemo}
              selectedProduct={selectedProductMemo}
              selectedUnderwriter={state.selectedUnderwriter}
              onUnderwriterSelect={(underwriter) => {
                actions.setSelectedUnderwriter && actions.setSelectedUnderwriter(underwriter);
              }}
            />
            {/* Footer navigation handles back/next; step-specific buttons removed */}
          </View>
        );
      }
      // Non-comprehensive path: documents upload
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Document Verification</Text>
          <Text style={styles.stepSubtitle}>
            Upload required documents for verification and extraction
          </Text>

          <DocumentsUpload
            selectedProduct={selectedProductMemo}
            vehicleData={vehicleDataMemo}
            onDocumentsChange={(documents) => {
              actions.updatePricingInputs({ documents });
            }}
            onExtractedData={handleDocumentExtracted}
            initialDocuments={state.pricingInputs.documents || {}}
          />
        </View>
      );
    }

    // Step 5: Add-ons Selection (comprehensive) OR Client Details (non-comprehensive)
    if (step === 5) {
      if (isComprehensive) {
        // Add-ons Selection Step for Comprehensive
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Additional Coverage</Text>
            <AddonSelectionStep
              selectedProduct={selectedProductMemo}
              vehicleData={vehicleDataMemo}
              underwriter={state.selectedUnderwriter}
              selectedAddons={state.selectedAddons || []}
              onAddonsChange={(addons) => actions.setSelectedAddons && actions.setSelectedAddons(addons)}
              onNext={() => setStep(6)}
            />
          </View>
        );
      }
      // For non-comprehensive, step 5 will be Client Details (handled below)
    }

    // Step 5: Client Details (non-comprehensive only - full form)
    if (!isComprehensive && step === 5) {
      // Debug logging to see what data we have
      console.log('=== CLIENT DETAILS DATA SOURCE DEBUG ===');
      console.log('Selected source:', clientDataSource);
      console.log('Logbook data:', extractedData.logbook);
      console.log('KRA PIN data:', extractedData.kra_pin);
      
      let allExtractedFields = {};
      
      if (clientDataSource === 'logbook') {
        // If Logbook selected: Use Logbook for ALL details, but fallback to other docs for missing fields
        allExtractedFields = {
          ...extractedData.kra_pin,   // Fallback for client details
          ...extractedData.id_copy,   // Fallback for client details  
          ...extractedData.logbook,   // Primary source (takes priority)
        };
        console.log('Using Logbook as primary, with fallbacks for missing fields');
      } else {
        // If National ID selected: Mix KRA PIN (client) + Logbook (vehicle)
        allExtractedFields = {
          ...extractedData.logbook,  // Vehicle details from logbook
          ...extractedData.kra_pin,  // Client details from KRA PIN (takes priority)
        };
        console.log('Using KRA PIN (client) + Logbook (vehicle)');
      }
      
      // SMART FIELD MAPPING: Map various field names to standardized names
      const smartMappedFields = {
        ...allExtractedFields,
        // Map owner_name if present but first_name/last_name are missing
        ...(allExtractedFields.owner_name && !allExtractedFields.first_name ? {
          first_name: allExtractedFields.owner_name.split(' ')[0] || '',
          last_name: allExtractedFields.owner_name.split(' ').slice(1).join(' ') || ''
        } : {}),
        // Ensure registration number is properly mapped
        registration_number: allExtractedFields.registration_number || allExtractedFields.reg_number || allExtractedFields.registration,
        // Ensure chassis is properly mapped  
        chassis_number: allExtractedFields.chassis_number || allExtractedFields.chassis,
        // Ensure ID number is mapped
        id_number: allExtractedFields.id_number || allExtractedFields.national_id || allExtractedFields.id_no,
      };
      
      console.log('Final merged fields:', smartMappedFields);
      
      // VALIDATION: Check if extracted data makes sense
      console.log('=== DATA VALIDATION ===');
      console.log('First Name:', smartMappedFields.first_name || smartMappedFields.owner_name || 'NOT FOUND');
      console.log('Last Name:', smartMappedFields.last_name || smartMappedFields.surname || 'NOT FOUND');
      console.log('KRA PIN:', smartMappedFields.kra_pin || smartMappedFields.pin_number || 'NOT FOUND');
      console.log('ID Number:', smartMappedFields.id_number || smartMappedFields.national_id || 'NOT FOUND');
      console.log('Car Registration:', smartMappedFields.registration_number || smartMappedFields.reg_number || 'NOT FOUND');
      console.log('Chassis:', smartMappedFields.chassis_number || smartMappedFields.chassis || 'NOT FOUND');
      console.log('Make:', smartMappedFields.make || smartMappedFields.vehicle_make || 'NOT FOUND');
      console.log('=== ALL FIELD NAMES IN EXTRACTED DATA ===');
      console.log('Available fields:', Object.keys(smartMappedFields));
      console.log('=========================================');
      
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Client Information</Text>
          <Text style={styles.stepSubtitle}>
            Owner name verified from: {clientDataSource === 'logbook' ? 'Logbook' : 'National ID'}
          </Text>
          <EnhancedClientForm
            selectedProduct={selectedProductMemo}
            vehicleData={vehicleDataMemo}
            extractedData={allExtractedFields}
            values={state.pricingInputs.clientDetails || {}}
            onChange={(clientDetails) => {
              actions.updatePricingInputs({ 
                clientDetails: clientDetails 
              });
            }}
            onValidationChange={(validationResult) => {
              // Store validation status for form completion checks
              console.log('Client form validation:', validationResult);
            }}
          />
        </View>
      );
    }

    // Step 6: Client Details (comprehensive only)
    if (isComprehensive && step === 6) {
      const clientDetails = state.pricingInputs?.clientDetails || {};
      
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Client Information</Text>
          <Text style={styles.stepSubtitle}>
            Enter the policy owner's details
          </Text>
          
          <ScrollView style={styles.formScrollView}>
            {/* Email - REQUIRED */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Email <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={clientDetails.email || ''}
                onChangeText={(text) => {
                  actions.updatePricingInputs({
                    clientDetails: { ...clientDetails, email: text }
                  });
                }}
                placeholder="e.g., john.doe@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text style={styles.helpText}>Email is required for sending policy documents</Text>
            </View>

            {/* Full Name - OPTIONAL */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Full Name (Optional)</Text>
              <TextInput
                style={styles.input}
                value={clientDetails.fullName || clientDetails.full_name || ''}
                onChangeText={(text) => {
                  actions.updatePricingInputs({
                    clientDetails: { ...clientDetails, fullName: text, full_name: text }
                  });
                }}
                placeholder="e.g., John Doe"
                autoCapitalize="words"
              />
            </View>

            {/* Phone - OPTIONAL */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Phone Number (Optional)</Text>
              <TextInput
                style={styles.input}
                value={clientDetails.phone || clientDetails.phone_number || ''}
                onChangeText={(text) => {
                  actions.updatePricingInputs({
                    clientDetails: { ...clientDetails, phone: text, phone_number: text }
                  });
                }}
                placeholder="e.g., 0712345678"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                ℹ️ Only email is required for comprehensive quotes. You can add more details later when converting to a policy.
              </Text>
            </View>
          </ScrollView>
        </View>
      );
    }

  // Step 6: Payment (non-comprehensive only)
  if (!isComprehensive && step === 6) {
      // Non-Comprehensive Payment Step
      // Use the selected underwriter's backend totals/breakdown verbatim
      // Align keys with backend: premium_breakdown provides base_premium, training_levy, pcf_levy, stamp_duty
      const effectivePremium = state.selectedUnderwriter ? (() => {
        const uw = state.selectedUnderwriter || {};
        const bd = uw.breakdown || {};
        const base = Number(
          bd.base_premium ?? bd.base ?? uw.base_premium ?? 0
        );
        const training = Number(bd.training_levy ?? uw.training_levy ?? Math.round(base * 0.0025));
        const pcf = Number(bd.pcf_levy ?? uw.pcf_levy ?? Math.round(base * 0.0025));
        const stamp = Number(bd.stamp_duty ?? uw.stamp_duty ?? 40);
        const total = Number(uw.total_premium ?? uw.totalPremium ?? base + training + pcf + stamp);
        return {
          base_premium: base,
          totalPremium: total,
          breakdown: bd,
          training_levy: training,
          pcf_levy: pcf,
          stamp_duty: stamp,
          extendible_config: uw.extendible_config
        };
      })() : state.calculatedPremium;

      // Debug: Check what data we're passing to EnhancedPayment
      console.log('MotorInsuranceScreen - Payment step data:', {
        selectedProduct: selectedProductMemo,
        vehicleData: vehicleDataMemo, 
        premium: effectivePremium,
        premium_extendible_config: effectivePremium?.extendible_config,
        underwriter: state.selectedUnderwriter,
        underwriter_extendible_config: state.selectedUnderwriter?.extendible_config,
        underwriter_is_extendible: state.selectedUnderwriter?.is_extendible,
        clientDetails: state.clientDetails,
        vehicleDetailsState: state.vehicleDetails
      });

      return (
        <View style={styles.stepContainer}>
          <EnhancedPayment
          selectedProduct={selectedProductMemo}
          vehicleData={vehicleDataMemo}
          premium={effectivePremium}
          underwriter={state.selectedUnderwriter}
          clientDetails={state.clientDetails || state.pricingInputs.clientDetails || state.pricingInputs}
          additionalCoverages={state.pricingInputs.additionalCoverages || []}
          selectedAddons={state.selectedAddons}
          addonsPremium={state.addonsPremium}
          addonsBreakdown={state.addonsBreakdown}
          paymentMethod={state.pricingInputs.paymentMethod}
          onPaymentMethodChange={(m) => actions.updatePricingInputs({ paymentMethod: m })}
          onCoverageChange={(selectedCoverages) => {
            actions.updatePricingInputs({ additionalCoverages: selectedCoverages });
          }}
          values={state.pricingInputs}
          onValuesChange={(data) => actions.updatePricingInputs(data)}
          />
        </View>
      );
    }

  // Step 7: Submission (both comprehensive and non-comprehensive)
    return <View style={{ flex: 1 }} />;
  };

  return (
    <View style={styles.screen}>
      <RNStatusBar barStyle="light-content" backgroundColor="#D5222B" />
      
      {/* Red Header Bar - Same as other insurance screens */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Motor Vehicle Insurance</Text>
        <View style={{ width: 40 }} />
      </View>
      
      {/* Progress Indicator - Below header, above content */}
      <ProgressIndicator steps={steps} current={step} />
      
      <View style={styles.content}>
        {/* Selected Product/Subcategory Display - Only show after category selection */}
        {selectedProductMemo && step > 0 && (
          <View style={styles.subcategoryHeader}>
            <Text style={styles.subcategoryTitle}>
              {getReadableCoverageName(selectedProductMemo)}
            </Text>
          </View>
        )}
        
        {renderContent()}
      </View>

      {/* Navigation Footer */}
      <NavigationButtons
        onNext={onNext}
        onBack={onBack}
        canNext={canProceed()}
        isFirstStep={step === 0}
        showBackOnFirstStep={false}
        onHome={navigateToHome}
        validationMessage={getValidationMessage()}
        insets={insets}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { 
    flex: 1, 
    backgroundColor: '#FFFFFF',
  },
  
  // Red Header Bar - Same as other insurance screens (WIBA, Medical, Last Expense)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,  // Red header
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,  // Further reduced for even smaller height
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    color: '#fff',
    fontSize: Typography.fontSize.lg,  // 18px - consistent with Typography system
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginTop: 4,
  },
  
  content: { flex: 1, paddingHorizontal: Spacing.md, paddingTop: 0, paddingBottom: 8 },  // Minimal padding for footer buttons
  
  // Subcategory Header
  subcategoryHeader: {
    backgroundColor: Colors.backgroundGray,
    marginHorizontal: -Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.xs,  // Keep minimal spacing below subcategory header
    marginTop: Spacing.xs,  // Add small top margin for separation from progress
    borderRadius: Spacing.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subcategoryTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  
  // Uniform step containers
  stepContainer: { 
    flex: 1,
    paddingTop: 0,  // Reduced from xs to 0 to bring form content closer to steps
    alignItems: 'stretch',
  },
  stepHeader: {
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  stepTitle: { 
    fontSize: Typography.fontSize.md,  // 16px - reduced from lg (18px) for better form hierarchy
    fontWeight: Typography.fontWeight.bold, 
    color: Colors.textPrimary, 
    marginBottom: Spacing.xs,
    textAlign: 'left',
    letterSpacing: 0.3,
  },
  stepSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: Typography.lineHeight.sm,
    textAlign: 'left',
    fontFamily: 'Poppins-Regular',
  },
  
  // Progress styles - Simplified and relaxed design
  progressContainer: {
    paddingVertical: Spacing.xs,  // Reduced from xl to xs for tighter spacing near header
    paddingHorizontal: Spacing.md,
    marginBottom: 0,  // Reduced from sm to 0 to bring content closer to steps
    backgroundColor: Colors.white,
  },
  progressRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: Spacing.xs,
    gap: 3,  // Subtle spacing between steps (3px)
  },
  progressActiveStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,  // Subtle spacing between active step elements
  },
  progressFirstStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,  // Subtle spacing for first step
  },
  progressDotSmall: {
    alignItems: 'center',
  },
  progressCircleSmall: {
    width: 28,  // Reduced for smaller circles
    height: 28, // Reduced for smaller circles
    borderRadius: 14,
    backgroundColor: Colors.backgroundGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleCompleted: {
    backgroundColor: Colors.success,
  },
  progressCircleActive: {
    backgroundColor: Colors.primary,
  },
  progressNumberSmall: {
    fontSize: Typography.fontSize.sm, // Reduced to match smaller circles
    fontWeight: Typography.fontWeight.bold,
    color: Colors.mediumGray,
  },
  progressNumberActive: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.bold,
  },
  progressDotActive: { 
    width: 32,  // Reduced for smaller active step
    height: 32, // Reduced for smaller active step
    borderRadius: 16, 
    backgroundColor: Colors.primary,
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, // Slightly more prominent shadow
    shadowRadius: 6,    // Larger shadow radius
    elevation: 5,       // Increased elevation
  },
  progressTextActive: { 
    color: Colors.white, 
    fontWeight: Typography.fontWeight.bold,
    fontSize: Typography.fontSize.md, // Increased from sm
  },
  progressLabelActive: { 
    fontSize: Typography.fontSize.sm, // Increased from xs for better readability
    color: Colors.primary,            // Using Colors.primary instead of hardcoded
    fontWeight: Typography.fontWeight.bold, // Using Typography constant
    textAlign: 'center',
    marginTop: Spacing.xs,            // Added spacing from number
  },
  progressDivider: {
    height: 1,
    backgroundColor: '#E9ECEF',
    marginTop: 0,
  },
  verificationFound: { marginTop: 8, color: '#0A7F42', fontWeight: '600' },
  verificationNotFound: { marginTop: 8, color: '#495057' },
  
  // Existing Cover Card Styles (Step 3)
  existingCoverCard: {
    backgroundColor: Colors.backgroundGray,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  existingCoverIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  existingCoverTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  existingCoverMessage: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: Typography.lineHeight.sm,
  },
  existingCoverDetails: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  existingCoverRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  existingCoverLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textSecondary,
  },
  existingCoverValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  adjustDateButton: {
    width: '100%',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: Spacing.borderRadius.md,
    paddingVertical: Spacing.padding.component,
    marginBottom: Spacing.sm,
  },
  adjustDateButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    textAlign: 'center',
  },
  existingCoverNote: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    fontStyle: 'italic',
  },
  submitDebitNoteButton: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Spacing.borderRadius.md,
    paddingVertical: Spacing.padding.component,
  },
  submitDebitNoteButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    textAlign: 'center',
  },
  
  // Client Data Source Selection Styles
  clientDataSourceSection: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  marginTopMd: {
    marginTop: Spacing.md,
  },
  radioGroup: {
    marginBottom: Spacing.md,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  radioCircleSelected: {
    borderColor: Colors.primary,
  },
  radioCircleInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  radioLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    flex: 1,
  },
  radioCheckmark: {
    marginLeft: Spacing.xs,
  },
  vehicleDetailsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: 9999,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignSelf: 'flex-start',
  },
  chipText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    marginRight: Spacing.xs,
  },

  // Simple Radio Selection Styles (matching Step 3 subcategory cards)
  simpleRadioContainer: {
    marginBottom: Spacing.md,
  },
  simpleRadioCard: {
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.md,
    padding: Spacing.padding.component,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: Colors.shadow,
    shadowOpacity: 0.02,
    elevation: 1,
  },
  simpleRadioCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  simpleRadioLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  simpleRadioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  simpleRadioCircleSelected: {
    borderColor: Colors.primary,
  },
  simpleRadioCircleInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  simpleRadioLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  simpleRadioLabelSelected: {
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
  },
  
  // Vehicle Details Card Styles
  simpleVehicleCard: {
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.md,
    padding: Spacing.padding.component,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: Colors.shadow,
    shadowOpacity: 0.02,
    elevation: 1,
  },
  simpleVehicleLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
  },

  // Bottom Drawer Modal Styles
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  drawerContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  drawerContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Spacing.borderRadius.xl,
    borderTopRightRadius: Spacing.borderRadius.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.lg,
    maxHeight: '70%', // Reduced from 85% to avoid covering navigation buttons
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  drawerHandle: {
    width: 40,
    height: 5,
    backgroundColor: Colors.border,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  drawerHeader: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  drawerShieldIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  drawerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  drawerCloseButton: {
    position: 'absolute',
    top: 0,
    right: Spacing.lg,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF5F5',
    borderRadius: Spacing.borderRadius.md,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  drawerInfoText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    lineHeight: 18,
  },
  drawerScrollContent: {
    flex: 1,
  },
  drawerDetailsCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: Spacing.borderRadius.md,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  drawerDetailItem: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  drawerDetailItemLast: {
    borderBottomWidth: 0,
  },
  drawerDetailLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontWeight: Typography.fontWeight.medium,
  },
  drawerDetailValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
  },
  drawerActions: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  drawerAdjustButton: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: Spacing.borderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  drawerAdjustButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.primary,
  },
  drawerSubmitButton: {
    backgroundColor: Colors.primary,
    borderRadius: Spacing.borderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  drawerSubmitButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.white,
  },
  
  quickVerifyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  quickVerifyTitle: { fontSize: 14, fontWeight: '700', color: '#2c3e50', marginBottom: 4 },
  quickVerifyText: { fontSize: 12, color: '#646767', marginBottom: 12, lineHeight: 18 },
  quickVerifyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quickVerifyButton: {
    backgroundColor: '#D5222B',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  quickVerifyButtonText: { color: '#fff', fontWeight: '600' },
  quickVerifyInline: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  quickVerifyInput: { flex: 1 },
  quickVerifyButtonSmall: { backgroundColor: '#D5222B', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 8 },
  
  // Check Policy Button (between category grid and navigation)
  checkPolicyContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
    alignItems: 'center'
  },
  checkPolicyButton: {
    backgroundColor: '#D5222B',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderRadius: 30, // More rounded to match screenshot
    marginBottom: 8,
    width: '100%',
    shadowColor: '#D5222B',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  checkPolicyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  checkPolicyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: -2,
  },
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  modalTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalCancel: {
    backgroundColor: '#F3F4F6',
  },
  modalCancelText: {
    color: '#111827',
    fontWeight: '600',
  },
  modalConfirm: {
    backgroundColor: '#D5222B',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  
  // Category grid styles (matching HomePage category cards)
  categoryCard: { 
    flex: 1,
    backgroundColor: '#FFFFFF', // Clean white background like homepage
    borderRadius: 20, 
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  selectedCard: {
    backgroundColor: '#FFF5F5', // Very subtle pink tint for selection
    borderWidth: 2,
    borderColor: Colors.primary, // Using Colors constant
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIconWrapper: { 
    marginBottom: Spacing.md, // Using Spacing constant instead of hardcoded 12
    alignItems: 'center', 
    justifyContent: 'center',
  },
  categoryTitle: { 
    fontSize: Typography.fontSize.md, // Using Typography constant instead of 16
    fontWeight: Typography.fontWeight.bold, // Using Typography constant
    color: Colors.textPrimary, // Using Colors constant
    textAlign: 'center',
  },
  
  // Subcategory styles
  sectionHeaderContainer: {
    backgroundColor: Colors.backgroundGray,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
    borderRadius: Spacing.borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  sectionHeaderText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subcategoryCard: { 
    backgroundColor: Colors.white, 
    borderRadius: Spacing.borderRadius.md, 
    padding: Spacing.padding.component, 
    marginBottom: Spacing.sm,
    borderWidth: 1, 
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.02,
    elevation: 1,
    width: '100%',
  },
  subcategoryTitle: { 
    fontWeight: Typography.fontWeight.semiBold, 
    color: Colors.textPrimary, 
    marginBottom: Spacing.xs, 
    fontSize: Typography.fontSize.md,
    lineHeight: Typography.lineHeight.md,
  },
  badgesRow: { 
    flexDirection: 'row', 
    gap: Spacing.xs, 
    marginBottom: Spacing.xs 
  },
  badge: { 
    backgroundColor: Colors.backgroundGray, 
    color: Colors.textSecondary, 
    paddingHorizontal: Spacing.sm, 
    paddingVertical: Spacing.xs / 2, 
    borderRadius: Spacing.borderRadius.sm, 
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  badgeOk: { backgroundColor: '#e7f5ff', color: '#1864ab' },
  badgeWarn: { backgroundColor: '#fff4e6', color: '#d9480f' },
  badgeInfo: { backgroundColor: '#e7f1ff', color: '#1e66f5' },
  requirements: { 
    color: Colors.textMuted, 
    fontSize: Typography.fontSize.xs, 
    fontStyle: 'italic',
    marginTop: Spacing.xs / 2,
  },
  
  // Form styles
  label: { fontWeight: '600', color: '#495057', fontSize: 13 },
  input: { 
    borderWidth: 1, 
    borderColor: '#ced4da', 
    borderRadius: 6, 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    backgroundColor: '#fff',
    fontSize: 15
  },
  error: { color: '#d90429', fontSize: 11 },
  
  // Radio group styles
  radioGroup: { flexDirection: 'row', gap: 16 },
  radioOption: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ced4da' },
  radioActive: { borderColor: '#D5222B', backgroundColor: '#D5222B' },
  
  // Premium display styles
  premiumCard: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: '#e9ecef',
    marginTop: 16
  },
  premiumTitle: { fontSize: 16, fontWeight: '700', color: '#2c3e50', marginBottom: 12 },
  premiumRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  premiumTotal: { 
    borderTopWidth: 1, 
    borderTopColor: '#e9ecef', 
    marginTop: 8, 
    paddingTop: 8 
  },
  totalText: { fontWeight: '700', color: '#2c3e50' },
  totalAmount: { fontWeight: '700', color: '#D5222B', fontSize: 16 },
  
  // Underwriter styles
  underwriterCard: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 20, 
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  underwriterName: { fontSize: 18, fontWeight: '700', color: '#2c3e50', marginBottom: 8 },
  underwriterPremium: { fontSize: 24, fontWeight: '700', color: '#D5222B', marginBottom: 16 },
  selectButton: { 
    backgroundColor: '#D5222B', 
    paddingHorizontal: 24, 
    paddingVertical: 12, 
    borderRadius: 8 
  },
  selectButtonText: { color: '#fff', fontWeight: '600' },
  
  // Review styles
  reviewCard: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 16, 
    gap: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  reviewTitle: { fontSize: 16, fontWeight: '700', color: '#2c3e50', marginBottom: 8 },
  reviewTotal: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#D5222B', 
    marginTop: 8, 
    paddingTop: 8, 
    borderTopWidth: 1, 
    borderTopColor: '#e9ecef' 
  },
  
  // Navigation styles
  navRow: { 
    flexDirection: 'row', 
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12, 
    paddingTop: 20, 
    paddingBottom: 8,
    borderTopWidth: 1, 
    borderTopColor: '#e9ecef' 
  },
  navigationButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    gap: 12,
  },
  backButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent', 
    borderWidth: 1, 
    borderColor: '#ced4da', 
    paddingVertical: 10, 
    paddingHorizontal: 16,
    borderRadius: 8, 
    minWidth: 90,
    gap: 4,
  },
  backButtonText: { 
    color: '#495057', 
    fontWeight: '600',
    fontSize: 14,
  },
  nextButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D5222B', 
    paddingVertical: 12, 
    paddingHorizontal: 20,
    borderRadius: 8, 
    flex: 1,
    maxWidth: 200,
    gap: 4,
  },
  navButtonContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nextButtonDisabled: { backgroundColor: '#ced4da' },
  nextButtonText: { 
    color: '#fff', 
    fontWeight: '600',
    fontSize: 14,
  },
  fullWidthNext: { 
    maxWidth: '100%', 
    alignSelf: 'stretch' 
  },

  // Cover Type Selection Styles
  coverTypeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    elevation: 2,
  },
  coverTypeTitle: { fontSize: 16, fontWeight: '700', color: '#2c3e50', marginBottom: 4 },
  coverTypeDesc: { fontSize: 14, color: '#646767', marginBottom: 8 },
  coverTypePrice: { fontSize: 14, fontWeight: '600', color: '#D5222B' },

  // Selected Cover Display
  selectedCoverCard: {
    backgroundColor: '#e7f5ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1864ab',
  },
  selectedCoverTitle: { fontSize: 16, fontWeight: '700', color: '#1864ab' },
  selectedCoverDesc: { fontSize: 14, color: '#495057', marginTop: 4 },

  // Info Card
  infoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#495057', marginBottom: 8 },
  infoText: { fontSize: 14, color: '#646767', lineHeight: 20 },

  // Vehicle Info Card
  vehicleInfoCard: {
    backgroundColor: '#fff4e6',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fd7e14',
  },
  vehicleInfoTitle: { fontSize: 16, fontWeight: '700', color: '#d9480f' },
  vehicleInfoDesc: { fontSize: 14, color: '#495057', marginTop: 4 },

  // Underwriter Selection
  underwriterOption: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 8,
  },
  underwriterSelected: { borderColor: '#D5222B', backgroundColor: '#fff5f5' },
  underwriterName: { fontSize: 16, fontWeight: '700', color: '#2c3e50' },
  underwriterRating: { fontSize: 14, color: '#646767', marginTop: 4 },

  // Section Cards
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#2c3e50', marginBottom: 8 },

  // KYC Styles
  kycInfoCard: {
    backgroundColor: '#e7f5ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1864ab',
  },
  kycInfoTitle: { fontSize: 16, fontWeight: '700', color: '#1864ab', marginBottom: 8 },
  kycInfoText: { fontSize: 14, color: '#495057', lineHeight: 20 },

  documentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  documentTitle: { fontSize: 16, fontWeight: '600', color: '#2c3e50' },
  documentStatus: { fontSize: 12, color: '#6c757d', fontWeight: '500' },
  documentStatusUploaded: { color: '#198754' },

  uploadButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#D5222B',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  uploadButtonText: { color: '#D5222B', fontWeight: '600' },

  verificationCard: {
    backgroundColor: '#d1edff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  verificationTitle: { fontSize: 16, fontWeight: '700', color: '#0c4a6e', marginBottom: 8 },
  verificationText: { fontSize: 14, color: '#374151', marginBottom: 12, lineHeight: 20 },
  verifyButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  verifyButtonText: { color: '#fff', fontWeight: '600' },

  // Summary Styles
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: '#2c3e50', marginBottom: 12 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: { fontSize: 14, color: '#646767', flex: 1 },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#2c3e50', flex: 1, textAlign: 'right' },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    marginTop: 8,
    paddingTop: 12,
  },
  summaryTotalLabel: { fontSize: 16, fontWeight: '700', color: '#2c3e50', flex: 1 },
  summaryTotalValue: { fontSize: 18, fontWeight: '700', color: '#D5222B', flex: 1, textAlign: 'right' },
  kycStatus: { fontSize: 14, color: '#198754', fontWeight: '500' },

  // Payment Styles
  paymentSummaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  paymentTitle: { fontSize: 18, fontWeight: '700', color: '#2c3e50', marginBottom: 12 },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  paymentLabel: { fontSize: 14, color: '#646767', flex: 1 },
  paymentValue: { fontSize: 14, fontWeight: '600', color: '#2c3e50', flex: 1, textAlign: 'right' },
  paymentTotal: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    marginTop: 8,
    paddingTop: 8,
  },
  paymentTotalLabel: { fontSize: 16, fontWeight: '700', color: '#2c3e50', flex: 1 },
  paymentTotalValue: { fontSize: 20, fontWeight: '700', color: '#D5222B', flex: 1, textAlign: 'right' },

  paymentMethodCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  paymentMethodTitle: { fontSize: 16, fontWeight: '700', color: '#2c3e50', marginBottom: 12 },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
    gap: 12,
  },
  paymentOptionSelected: { borderColor: '#D5222B', backgroundColor: '#fff5f5' },
  paymentOptionIcon: { fontSize: 24 },
  paymentOptionTitle: { fontSize: 16, fontWeight: '600', color: '#2c3e50' },
  paymentOptionDesc: { fontSize: 12, color: '#646767', marginTop: 2 },
  paymentRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ced4da',
  },
  paymentRadioActive: { borderColor: '#D5222B', backgroundColor: '#D5222B' },

  paymentFormCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  paymentFormTitle: { fontSize: 16, fontWeight: '700', color: '#2c3e50', marginBottom: 8 },
  initiatePaymentButton: {
    backgroundColor: '#D5222B',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  initiatePaymentText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  paymentConfirmationCard: {
    backgroundColor: '#d1edff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#0ea5e9',
    alignItems: 'center',
  },
  confirmationTitle: { fontSize: 18, fontWeight: '700', color: '#0c4a6e', marginBottom: 12 },
  confirmationText: { fontSize: 16, color: '#374151', marginBottom: 8, textAlign: 'center' },
  confirmationDetails: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  confirmationStatus: { fontSize: 14, fontWeight: '600', color: '#059669', marginBottom: 8 },
  confirmationNext: { fontSize: 14, color: '#374151', textAlign: 'center', lineHeight: 20 },

  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#646767',
    textAlign: 'center',
  },

  // Selected card style
  selectedCard: {
    borderColor: '#D5222B',
    backgroundColor: '#fff5f5',
    borderWidth: 2,
  },

  // Tonnage selector styles
  tonnageSelector: {
    flexDirection: 'column',
    gap: 8,
  },
  tonnageOption: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tonnageOptionSelected: {
    backgroundColor: '#fff5f5',
    borderColor: '#D5222B',
    borderWidth: 2,
  },
  tonnageText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  tonnageTextSelected: {
    color: '#D5222B',
    fontWeight: '700',
  },

  // Error container styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#dc3545',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Payment and Submission step styles
  sectionContainer: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryText: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentText: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 12,
  },
  paymentMethods: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  paymentMethod: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  paymentMethodText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
  },
  confirmationCard: {
    backgroundColor: '#e7f3ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#b3d9ff',
  },
  confirmationText: {
    fontSize: 14,
    color: '#1864ab',
    textAlign: 'center',
  },
  submissionCard: {
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  submissionText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
  receiptCard: {
    backgroundColor: '#d1edff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#9fdbff',
  },
  receiptText: {
    fontSize: 14,
    color: '#0c5aa6',
    textAlign: 'center',
  },

  underwriterPlaceholder: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 20,
    margin: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D5222B',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D5222B',
    marginBottom: 4,
  },
  placeholderSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  
  // Existing Cover Screen Styles (Step 3 - Full Screen)
  existingCoverContainer: {
    flexGrow: 1,
    paddingBottom: Spacing.xl,
  },
  existingCoverIconWrapper: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  existingCoverShieldIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  existingCoverScreenTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  existingCoverMessageBox: {
    backgroundColor: Colors.white,
    borderRadius: 9999, // Fully rounded pill
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  existingCoverMessageText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  existingCoverDetailsCard: {
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  existingCoverDetailItem: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  existingCoverDetailItemLast: {
    borderBottomWidth: 0,
  },
  existingCoverDetailLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  existingCoverDetailValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
  },
  existingCoverAdjustButton: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: Spacing.borderRadius.lg,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  existingCoverAdjustButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  existingCoverSubmitButton: {
    backgroundColor: Colors.primary,
    borderRadius: Spacing.borderRadius.lg,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  existingCoverSubmitButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  // Client Data Source Selection styles
  clientDataSourceSection: {
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  radioGroup: {
    flexDirection: 'column',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: Colors.primary,
  },
  radioCircleInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  radioLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    fontWeight: Typography.fontWeight.medium,
    flex: 1,
  },
  radioCheckmark: {
    marginLeft: Spacing.sm,
  },
  marginTopMd: {
    marginTop: Spacing.md,
  },
  vehicleDetailsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignSelf: 'flex-start',
  },
  chipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    marginRight: Spacing.xs,
  },
  
  // Client Form Styles (Comprehensive)
  formScrollView: {
    flex: 1,
  },
  fieldContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  required: {
    color: Colors.error,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  helpText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    borderRadius: Spacing.borderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: '#1565C0',
    lineHeight: Typography.lineHeight.sm,
  },
  submissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  submissionText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
});
