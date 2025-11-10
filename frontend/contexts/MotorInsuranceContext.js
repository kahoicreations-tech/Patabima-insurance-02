import React, { createContext, useContext, useMemo, useReducer, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import motorPricingService from '../services/MotorInsurancePricingService';
import djangoAPI from '../services/DjangoAPIService';
import AddonCalculationService from '../services/AddonCalculationService';
import { DEBOUNCE_MS, PRODUCT_TYPES } from '../constants/motorInsuranceConfig';
import { validatePricingInputs, isFormValid } from '../utils/motorInsuranceValidation';

const MotorInsuranceContext = createContext(null);

const initialState = {
  selectedCategory: null,
  selectedSubcategory: null,
  productType: null,
  vehicleDetails: {},
  pricingInputs: {},
  // Store form data per subcategory to prevent bleeding across subcategories
  subcategoryFormData: {}, // { subcategory_code: { vehicleDetails: {}, pricingInputs: {} } }
  clientDetails: {},
  extractedDocuments: {}, // Store extracted document data
  uploadedDocuments: {}, // Store uploaded document metadata (S3 URLs, document IDs, etc.)
  clientDataSource: 'logbook', // 'logbook' | 'national_id' - determines which document to use for client details
  availableSubcategories: [], // Store loaded subcategories for selected category
  availableUnderwriters: [],
  selectedUnderwriter: null,
  pricingComparison: [],
  calculatedPremium: null,
  currentStep: 0,
  isLoading: false,
  errors: {},
  formValidation: {},
  // Add-ons state management
  selectedAddons: [],
  addonsPremium: 0,
  addonsBreakdown: [],
  // DMVIC state management (Phase 3.2)
  dmvicCache: {}, // { regNumber: { result, timestamp } }
  dmvicCacheTTL: 30 * 60 * 1000, // 30 minutes
  minCoverStartDate: null, // ISO string or null - minimum date enforced by DMVIC existing cover
  existingCoverData: null, // { hasExistingCover, expiryDate, policyNumber, underwriter }
  showVerificationScreen: false, // Controls VehicleVerificationScreen modal visibility
  // History State for undo/redo
  past: [],
  future: [],
  // DMVIC processed registrations (persist across remounts to avoid repeated API calls)
  dmvicProcessedRegMap: {}, // { 'KAC040R': true }
};

function saveForHistory(state, newState) {
  const snapshot = {
    selectedCategory: state.selectedCategory,
    selectedSubcategory: state.selectedSubcategory,
    productType: state.productType,
    vehicleDetails: state.vehicleDetails,
    pricingInputs: state.pricingInputs,
    clientDetails: state.clientDetails,
    selectedAddons: state.selectedAddons,
  };
  return { ...newState, past: [...state.past, snapshot], future: [] };
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_CATEGORY_SELECTION':
      // Save current form data for the previous subcategory
      const currentSubcategoryCode = state.selectedSubcategory?.subcategory_code;
      let updatedSubcategoryFormData = { ...state.subcategoryFormData };
      
      if (currentSubcategoryCode) {
        updatedSubcategoryFormData[currentSubcategoryCode] = {
          vehicleDetails: state.vehicleDetails,
          pricingInputs: state.pricingInputs
        };
      }
      
      // Get form data for the new subcategory (if any)
      const newSubcategoryCode = action.payload.subcategory?.subcategory_code;
      const savedFormData = newSubcategoryCode ? updatedSubcategoryFormData[newSubcategoryCode] : null;
      
      return saveForHistory(state, { 
        ...state, 
        selectedCategory: action.payload.category, 
        selectedSubcategory: action.payload.subcategory, 
        productType: action.payload.productType || state.productType,
        subcategoryFormData: updatedSubcategoryFormData,
        // Reset form data for new subcategory or restore saved data
        vehicleDetails: savedFormData?.vehicleDetails || {},
        pricingInputs: savedFormData?.pricingInputs || {},
        // Clear pricing comparison when subcategory changes
        pricingComparison: [],
        selectedUnderwriter: null,
        calculatedPremium: null,
        // ✅ Clear DMVIC state when switching categories (Phase 1.3 fix)
        existingCoverData: {},
        minCoverStartDate: null,
        showVerificationScreen: false
      });
    case 'UPDATE_VEHICLE_DETAILS':
      const updatedVehicleDetails = { ...state.vehicleDetails, ...action.payload };
      let vehicleSubcategoryFormData = { ...state.subcategoryFormData };
      
      // Handle underwriter synchronization - preserve full object when string arrives
      // Check BOTH 'selectedUnderwriter' and 'underwriter' keys (different components use different keys)
      let newSelectedUnderwriter = state.selectedUnderwriter;
      const uwString = action.payload.selectedUnderwriter || action.payload.underwriter;
      
      if (uwString) {
        if (typeof uwString === 'string') {
          // String received - check if we already have a full object with matching name
          if (state.selectedUnderwriter) {
            const existingName = state.selectedUnderwriter.name || 
                                state.selectedUnderwriter.underwriter_name || 
                                state.selectedUnderwriter.company;
            
            if (existingName === uwString) {
              // Names match - preserve the existing full object, don't downgrade to string
              console.log('[Context] Preserving full underwriter object for:', uwString);
              newSelectedUnderwriter = state.selectedUnderwriter;
              // Remove the string from vehicleDetails to avoid confusion
              delete updatedVehicleDetails.underwriter;
              delete updatedVehicleDetails.selectedUnderwriter;
            } else {
              // Names don't match - this is a different selection (shouldn't happen with proper flow)
              console.warn('[Context] Underwriter name mismatch:', existingName, 'vs', uwString);
              newSelectedUnderwriter = state.selectedUnderwriter; // Keep existing for safety
            }
          } else {
            // No existing object - this is likely a partial update, keep as string for now
            console.log('[Context] No existing underwriter object, accepting string:', uwString);
          }
        } else {
          // Full object received - use it directly
          console.log('[Context] Full underwriter object received:', uwString.name || uwString.underwriter_name);
          newSelectedUnderwriter = uwString;
        }
      }
      
      // Also save to subcategory-specific storage
      const vehicleSubcategoryCode = state.selectedSubcategory?.subcategory_code;
      if (vehicleSubcategoryCode) {
        vehicleSubcategoryFormData[vehicleSubcategoryCode] = {
          ...vehicleSubcategoryFormData[vehicleSubcategoryCode],
          vehicleDetails: updatedVehicleDetails
        };
      }
      
      return saveForHistory(state, { 
        ...state, 
        vehicleDetails: updatedVehicleDetails,
        selectedUnderwriter: newSelectedUnderwriter,
        subcategoryFormData: vehicleSubcategoryFormData
      });
    case 'UPDATE_PRICING_INPUTS': {
      // Deep-merge clientDetails to avoid losing nested fields on updates
      const incomingClientDetails = action.payload?.clientDetails;
      const mergedClientDetails = incomingClientDetails
        ? { ...(state.pricingInputs?.clientDetails || {}), ...(incomingClientDetails || {}) }
        : (state.pricingInputs?.clientDetails || undefined);

      // Build next pricingInputs with shallow merge + optional deep clientDetails
      const nextPricingInputsBase = { ...state.pricingInputs, ...action.payload };
      if (incomingClientDetails) {
        nextPricingInputsBase.clientDetails = mergedClientDetails;
      }

      // Mirror vehicle make/model from clientDetails into top-level pricingInputs
      if (mergedClientDetails) {
        if (mergedClientDetails.vehicle_make) {
          nextPricingInputsBase.vehicle_make = mergedClientDetails.vehicle_make;
        }
        if (mergedClientDetails.vehicle_model) {
          nextPricingInputsBase.vehicle_model = mergedClientDetails.vehicle_model;
        }
      }

      // Also mirror into vehicleDetails to keep downstream steps consistent
      let nextVehicleDetails = state.vehicleDetails;
      if (mergedClientDetails && (mergedClientDetails.vehicle_make || mergedClientDetails.vehicle_model)) {
        nextVehicleDetails = {
          ...state.vehicleDetails,
          ...(mergedClientDetails.vehicle_make ? { make: mergedClientDetails.vehicle_make } : {}),
          ...(mergedClientDetails.vehicle_model ? { model: mergedClientDetails.vehicle_model } : {}),
        };
      }

      let pricingSubcategoryFormData = { ...state.subcategoryFormData };
      // Also save to subcategory-specific storage
      const pricingSubcategoryCode = state.selectedSubcategory?.subcategory_code;
      if (pricingSubcategoryCode) {
        pricingSubcategoryFormData[pricingSubcategoryCode] = {
          ...pricingSubcategoryFormData[pricingSubcategoryCode],
          pricingInputs: nextPricingInputsBase
        };
      }

      return saveForHistory(state, { 
        ...state, 
        pricingInputs: nextPricingInputsBase,
        vehicleDetails: nextVehicleDetails,
        subcategoryFormData: pricingSubcategoryFormData
      });
    }
    case 'UPDATE_CLIENT_DETAILS':
      return saveForHistory(state, { ...state, clientDetails: { ...state.clientDetails, ...action.payload } });
    case 'UPDATE_EXTRACTED_DOCUMENTS':
      return { ...state, extractedDocuments: { ...state.extractedDocuments, ...action.payload } };
    case 'UPDATE_UPLOADED_DOCUMENTS':
      return { ...state, uploadedDocuments: { ...state.uploadedDocuments, ...action.payload } };
    case 'SET_CLIENT_DATA_SOURCE':
      return { ...state, clientDataSource: action.payload };
    case 'SET_SUBCATEGORIES':
      return { ...state, availableSubcategories: action.payload || [] };
    case 'SET_LOADING':
      return { ...state, isLoading: !!action.payload };
    case 'SET_ERRORS':
      return { ...state, errors: action.payload || {} };
    case 'SET_VALIDATION':
      return { ...state, formValidation: action.payload || {} };
    case 'SET_UNDERWRITERS':
      return { ...state, availableUnderwriters: action.payload || [] };
    case 'SET_SELECTED_UNDERWRITER':
      // Prevent noisy re-renders & effect spam when the same underwriter object
      // (or an equivalent one reconstructed from comparison results) is dispatched repeatedly.
      // We treat an incoming payload as "same" if key identity props match.
      try {
        const incoming = action.payload || null;
        const existing = state.selectedUnderwriter;
        if (existing && incoming) {
          const norm = (uw) => ({
            code: uw.code || uw.underwriter_code || uw.company_code || uw.id || null,
            name: uw.name || uw.underwriter_name || uw.company || null,
            base: Number(
              uw.base_premium ||
              uw.premium_breakdown?.base_premium ||
              uw.breakdown?.base_premium ||
              uw.breakdown?.base || 0
            ),
            total: Number(
              uw.total_premium ||
              uw.premium_breakdown?.total_premium ||
              uw.totalPremium ||
              uw.premium || 0
            ),
          });
          const a = norm(existing);
          const b = norm(incoming);
          const isSame = a.code === b.code && a.name === b.name && a.base === b.base && a.total === b.total;
          if (isSame) {
            // Skip state update – silently ignore duplicate selection
            console.log('[MotorInsuranceContext] Ignoring duplicate underwriter selection:', a.name);
            return state;
          } else {
            console.log('[MotorInsuranceContext] Underwriter changed:', { from: a, to: b });
          }
        }
      } catch (e) {
        // Non-fatal – fall through to update
        console.warn('[MotorInsuranceContext] Underwriter dedupe check failed:', e?.message || e);
      }
      return { ...state, selectedUnderwriter: action.payload || null };
    case 'SET_CALCULATED_PREMIUM':
      return { ...state, calculatedPremium: action.payload };
    case 'SET_PRICING_COMPARISON':
      return { ...state, pricingComparison: action.payload || [] };
    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_SELECTED_ADDONS': {
      const addonsCalculation = AddonCalculationService.calculateTotalAddonsPremium(
        action.payload,
        state.vehicleDetails,
        state.selectedUnderwriter
      );
      return saveForHistory(state, {
        ...state,
        selectedAddons: action.payload,
        addonsPremium: addonsCalculation.total,
        addonsBreakdown: addonsCalculation.breakdown
      });
    }
    case 'CALCULATE_ADDONS_PREMIUM': {
      if (!state.selectedAddons.length) return state;
      const addonsCalculation = AddonCalculationService.calculateTotalAddonsPremium(
        state.selectedAddons,
        state.vehicleDetails,
        state.selectedUnderwriter
      );
      return {
        ...state,
        addonsPremium: addonsCalculation.total,
        addonsBreakdown: addonsCalculation.breakdown
      };
    }
    case 'UNDO': {
      if (!state.past.length) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);
      const present = {
        selectedCategory: state.selectedCategory,
        selectedSubcategory: state.selectedSubcategory,
        productType: state.productType,
        vehicleDetails: state.vehicleDetails,
        pricingInputs: state.pricingInputs,
        clientDetails: state.clientDetails,
        selectedAddons: state.selectedAddons,
      };
      return { ...state, ...previous, past: newPast, future: [present, ...state.future] };
    }
    case 'REDO': {
      if (!state.future.length) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      const present = {
        selectedCategory: state.selectedCategory,
        selectedSubcategory: state.selectedSubcategory,
        productType: state.productType,
        vehicleDetails: state.vehicleDetails,
        pricingInputs: state.pricingInputs,
        clientDetails: state.clientDetails,
        selectedAddons: state.selectedAddons,
      };
      return { ...state, ...next, past: [...state.past, present], future: newFuture };
    }
    case 'SET_EXISTING_COVER_DATA':
      console.log('[MotorReducer] 🔥 SET_EXISTING_COVER_DATA received, payload:', JSON.stringify(action.payload, null, 2));
      const newStateWithCover = {
        ...state,
        existingCoverData: action.payload,
      };
      console.log('[MotorReducer] ✅ New existingCoverData:', JSON.stringify(newStateWithCover.existingCoverData, null, 2));
      return newStateWithCover;
    case 'SET_MIN_COVER_START_DATE':
      console.log('[MotorReducer] 🔥 SET_MIN_COVER_START_DATE received, payload:', action.payload);
      const newStateWithMinDate = {
        ...state,
        minCoverStartDate: action.payload,
      };
      console.log('[MotorReducer] ✅ New minCoverStartDate:', newStateWithMinDate.minCoverStartDate);
      return newStateWithMinDate;
    case 'SET_SHOW_VERIFICATION_SCREEN':
      console.log('[MotorReducer] 🔥 SET_SHOW_VERIFICATION_SCREEN received, payload:', action.payload);
      const newStateWithVerification = {
        ...state,
        showVerificationScreen: action.payload,
      };
      console.log('[MotorReducer] ✅ New showVerificationScreen:', newStateWithVerification.showVerificationScreen);
      return newStateWithVerification;
    case 'MARK_DMVIC_PROCESSED': {
      const reg = (action.payload || '').toUpperCase().trim();
      if (!reg) return state;
      return {
        ...state,
        dmvicProcessedRegMap: { ...state.dmvicProcessedRegMap, [reg]: true },
      };
    }
    case 'CLEAR_DMVIC_PROCESSED': {
      return {
        ...state,
        dmvicProcessedRegMap: {},
      };
    }
    case 'CACHE_DMVIC_RESULT': {
      return {
        ...state,
        dmvicCache: {
          ...state.dmvicCache,
          [action.payload.regNumber]: {
            result: action.payload.result,
            timestamp: Date.now(),
          },
        },
      };
    }
    case 'CLEAR_DMVIC_CACHE':
      return {
        ...state,
        dmvicCache: {},
        existingCoverData: null,
        minCoverStartDate: null,
        showVerificationScreen: false,
      };
    case 'RESET_FLOW':
      // Reset to completely clean initial state - no data preservation
      return {
        ...initialState,
        // DO NOT preserve subcategoryFormData to prevent cache issues
        // Each new policy should start with clean slate
      };
    default:
      return state;
  }
}

export function MotorInsuranceProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const calcTimerRef = useRef(null);
  const inflightCalcRef = useRef(null);
  const offlineRef = useRef(false);
  const isInitialMount = useRef(true);

  // Clear any existing cached state on mount for fresh start
  React.useEffect(() => {
    const clearPersistedState = async () => {
      try {
        await AsyncStorage.removeItem('motor_insurance_flow_state');
        await AsyncStorage.removeItem('cache_underwriters');
        await AsyncStorage.removeItem('cache_last_premium');
        console.log('✅ Motor insurance cache cleared on initialization');
      } catch (error) {
        console.warn('⚠️ Failed to clear cached state on mount:', error);
      } finally {
        isInitialMount.current = false;
      }
    };
    clearPersistedState();
  }, []);

  // Persistence functionality disabled - force fresh start each time
  // React.useEffect(() => {
  //   // Skip initial mount to avoid overwriting with initial state
  //   if (isInitialMount.current) return;

  //   const persistState = async () => {
  //     try {
  //       const stateToPersist = {
  //         selectedCategory: state.selectedCategory,
  //         selectedSubcategory: state.selectedSubcategory,
  //         productType: state.productType,
  //         vehicleDetails: state.vehicleDetails,
  //         pricingInputs: state.pricingInputs,
  //         clientDetails: state.clientDetails,
  //         extractedDocuments: state.extractedDocuments,
  //         availableSubcategories: state.availableSubcategories,
  //         selectedUnderwriter: state.selectedUnderwriter,
  //         selectedAddons: state.selectedAddons,
  //         currentStep: state.currentStep,
  //         subcategoryFormData: state.subcategoryFormData,
  //       };
  //       await AsyncStorage.setItem('motor_insurance_flow_state', JSON.stringify(stateToPersist));
  //     } catch (error) {
  //       console.warn('⚠️ Failed to persist state:', error);
  //     }
  //   };

  //   // Debounce persistence to avoid too frequent writes
  //   const timeoutId = setTimeout(persistState, 500);
  //   return () => clearTimeout(timeoutId);
  // }, [
  //   state.selectedCategory,
  //   state.selectedSubcategory,
  //   state.productType,
  //   state.vehicleDetails,
  //   state.pricingInputs,
  //   state.clientDetails,
  //   state.extractedDocuments,
  //   state.availableSubcategories,
  //   state.extractedDocuments,
  //   state.selectedUnderwriter,
  //   state.selectedAddons,
  //   state.currentStep,
  //   state.subcategoryFormData,
  // ]);

  const actions = useMemo(() => ({
    setCategorySelection: ({ category, subcategory, productType }) => {
      dispatch({ type: 'SET_CATEGORY_SELECTION', payload: { category, subcategory, productType } });
    },

    updateVehicleDetails: (updates) => {
      dispatch({ type: 'UPDATE_VEHICLE_DETAILS', payload: updates });
    },

    updatePricingInputs: (updates) => {
      dispatch({ type: 'UPDATE_PRICING_INPUTS', payload: updates });
      actions.debouncedCalculate();
    },

    updateClientDetails: (updates) => {
      dispatch({ type: 'UPDATE_CLIENT_DETAILS', payload: updates });
    },

    updateExtractedDocuments: (updates) => {
      dispatch({ type: 'UPDATE_EXTRACTED_DOCUMENTS', payload: updates });
    },

    updateUploadedDocuments: (updates) => {
      dispatch({ type: 'UPDATE_UPLOADED_DOCUMENTS', payload: updates });
    },

    setClientDataSource: (source) => {
      dispatch({ type: 'SET_CLIENT_DATA_SOURCE', payload: source });
    },

    setSubcategories: (subcategories) => {
      dispatch({ type: 'SET_SUBCATEGORIES', payload: subcategories });
    },

    // Expose a direct setter for calculated premium so UI can set results from pricing screens
    setPremiumCalculation: (premiumResult) => {
      dispatch({ type: 'SET_CALCULATED_PREMIUM', payload: premiumResult });
    },

    loadUnderwriters: async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      const cacheKey = (() => {
        const cat = state.selectedCategory?.category_code || state.productType?.category_code || 'ALL';
        const sub = state.selectedSubcategory?.subcategory_code || 'ANY';
        return `cache_underwriters_${cat}_${sub}`;
      })();
      const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
      try {
        // 1) Try cache first
        const cachedStr = await AsyncStorage.getItem(cacheKey);
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          const isFresh = (Date.now() - (cached.timestamp || 0)) < TTL_MS;
          if (isFresh && Array.isArray(cached.data)) {
            dispatch({ type: 'SET_UNDERWRITERS', payload: cached.data });
            // Background refresh to keep data up to date, non-blocking
            djangoAPI.getUnderwriters({
              category_code: state.selectedCategory?.category_code || state.productType?.category_code,
              subcategory_code: state.selectedSubcategory?.subcategory_code,
            }).then((u) => {
              const list = Array.isArray(u) ? u : (u?.underwriters || []);
              if (list?.length) {
                AsyncStorage.setItem(cacheKey, JSON.stringify({ data: list, timestamp: Date.now() })).catch(() => {});
                dispatch({ type: 'SET_UNDERWRITERS', payload: list });
              }
            }).catch(() => {});
            return cached.data;
          }
        }

        // 2) Fetch fresh if no cache or stale
        const u = await djangoAPI.getUnderwriters({
          category_code: state.selectedCategory?.category_code || state.productType?.category_code,
          subcategory_code: state.selectedSubcategory?.subcategory_code,
        });
        const list = Array.isArray(u) ? u : (u?.underwriters || []);
        dispatch({ type: 'SET_UNDERWRITERS', payload: list });
        // Save to cache
        await AsyncStorage.setItem(cacheKey, JSON.stringify({ data: list, timestamp: Date.now() }));
        return list;
      } catch (e) {
        dispatch({ type: 'SET_ERRORS', payload: { general: String(e?.message || e) } });
        // 3) Fallback to any generic cache
        try {
          const generic = await AsyncStorage.getItem('cache_underwriters_fallback');
          if (generic) {
            const parsed = JSON.parse(generic);
            if (Array.isArray(parsed.data)) {
              dispatch({ type: 'SET_UNDERWRITERS', payload: parsed.data });
              return parsed.data;
            }
          }
        } catch {}
        return [];
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    calculatePremium: async () => {
      if (!state.productType) return null;
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const errors = validatePricingInputs(state.productType, { ...state.vehicleDetails, ...state.pricingInputs });
        dispatch({ type: 'SET_VALIDATION', payload: errors });
        if (!isFormValid(errors)) return null;
        if (inflightCalcRef.current) {
          inflightCalcRef.current.abort();
        }
        const controller = new AbortController();
        inflightCalcRef.current = controller;
        const res = await motorPricingService.calculatePremium(
          state.productType,
          {
            ...state.vehicleDetails,
            ...state.pricingInputs,
            subcategory_code: state.selectedSubcategory?.subcategory_code,
            // Handle both object and string underwriter formats
            underwriter_code: (() => {
              const uw = state.selectedUnderwriter;
              if (uw?.code) return uw.code;
              if (uw?.company_code) return uw.company_code;
              if (typeof uw === 'string') return uw;
              // Fallback to vehicleDetails if needed
              const vehicleUw = state.vehicleDetails?.selectedUnderwriter;
              if (typeof vehicleUw === 'string') return vehicleUw;
              return null;
            })(),
            underwriter: (() => {
              const uw = state.selectedUnderwriter;
              if (uw?.name || uw?.underwriter_name) return uw.name || uw.underwriter_name;
              if (typeof uw === 'string') return uw;
              // Fallback to vehicleDetails if needed
              const vehicleUw = state.vehicleDetails?.selectedUnderwriter;
              if (typeof vehicleUw === 'string') return vehicleUw;
              return null;
            })(),
          },
          { signal: controller.signal }
        );
        dispatch({ type: 'SET_CALCULATED_PREMIUM', payload: res });
        // Cache disabled - no premium caching for fresh calculations each time
        return res;
      } catch (e) {
        console.error('Premium calculation error:', {
          error: e?.message || e,
          productType: state.productType,
          selectedUnderwriter: state.selectedUnderwriter,
          vehicleDetailsUnderwriter: state.vehicleDetails?.selectedUnderwriter,
          subcategory: state.selectedSubcategory?.subcategory_code
        });
        dispatch({ type: 'SET_ERRORS', payload: { pricing: String(e?.message || e) } });
        // No cached fallback - force fresh data entry
        return null;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    debouncedCalculate: () => {
      if (calcTimerRef.current) clearTimeout(calcTimerRef.current);
      calcTimerRef.current = setTimeout(() => {
        actions.calculatePremium();
      }, DEBOUNCE_MS);
    },

    comparePricing: async (underwriterIds) => {
      if (!state.productType) return [];
      
      // Generate cache key based on product and inputs
      const cacheKey = JSON.stringify({
        productType: state.productType?.code || state.productType?.subcategory_code,
        category: state.selectedCategory?.category_code,
        subcategory: state.selectedSubcategory?.subcategory_code,
        vehicleReg: state.vehicleDetails?.registrationNumber,
        sumInsured: state.vehicleDetails?.sum_insured || state.pricingInputs?.sumInsured,
        tonnage: state.vehicleDetails?.tonnage || state.pricingInputs?.tonnage,
        capacity: state.vehicleDetails?.passengerCapacity || state.pricingInputs?.passengerCapacity,
      });
      
      // Check cache first (5 minute TTL)
      const COMPARISON_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
      const cacheStorageKey = `comparison_cache_${state.selectedSubcategory?.subcategory_code}`;
      
      try {
        const cached = await AsyncStorage.getItem(cacheStorageKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          const isFresh = (Date.now() - (parsed.timestamp || 0)) < COMPARISON_CACHE_TTL;
          if (isFresh && parsed.key === cacheKey && Array.isArray(parsed.data)) {
            console.log('✅ Using cached comparison data');
            dispatch({ type: 'SET_PRICING_COMPARISON', payload: parsed.data });
            return parsed.data;
          }
        }
      } catch {}
      
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const errors = validatePricingInputs(state.productType, { ...state.vehicleDetails, ...state.pricingInputs });
        dispatch({ type: 'SET_VALIDATION', payload: errors });
        if (!isFormValid(errors)) return [];
        // Allow callers to pass either objects or codes; normalize to codes list
        const codes = (underwriterIds || []).map((u) => {
          if (!u) return null;
          if (typeof u === 'string') return u;
          return u.code || u.company_code || u.underwriter_code || null;
        }).filter(Boolean);
        const res = await motorPricingService.comparePricing(
          state.productType,
          {
            ...state.vehicleDetails,
            ...state.pricingInputs,
            subcategory_code: state.selectedSubcategory?.subcategory_code,
          },
          codes
        );
        dispatch({ type: 'SET_PRICING_COMPARISON', payload: res });
        
        // Cache the result
        try {
          await AsyncStorage.setItem(cacheStorageKey, JSON.stringify({
            key: cacheKey,
            data: res,
            timestamp: Date.now()
          }));
          console.log('💾 Cached comparison data');
        } catch {}
        
        return res;
      } catch (e) {
        dispatch({ type: 'SET_ERRORS', payload: { comparison: String(e?.message || e) } });
        return [];
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    submitQuotation: async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const payload = {
          ...state.vehicleDetails,
          ...state.pricingInputs,
          ...state.clientDetails,
          underwriter_id: state.selectedUnderwriter?.id,
          product_type: state.productType,
        };
        const res = await motorPricingService.submitQuotation(payload);
        return res;
      } catch (e) {
        dispatch({ type: 'SET_ERRORS', payload: { submit: String(e?.message || e) } });
        return null;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    validateForm: () => {
      const errors = validatePricingInputs(state.productType, { ...state.vehicleDetails, ...state.pricingInputs });
      dispatch({ type: 'SET_VALIDATION', payload: errors });
      return isFormValid(errors);
    },

    setCurrentStep: (step) => dispatch({ type: 'SET_CURRENT_STEP', payload: step }),
    setSelectedUnderwriter: (u) => dispatch({ type: 'SET_SELECTED_UNDERWRITER', payload: u }),
    
    // Add-ons actions
    setSelectedAddons: (addons) => {
      dispatch({ type: 'SET_SELECTED_ADDONS', payload: addons });
    },
    calculateAddonsPremium: () => {
      dispatch({ type: 'CALCULATE_ADDONS_PREMIUM' });
    },
    
    // Flow control actions
    resetFlow: async () => {
      dispatch({ type: 'RESET_FLOW' });
      try {
        // Clear ALL Motor2-related caches to prevent data bleeding
        const motor2CacheKeys = [
          'motor_insurance_flow_state',
          'cache_underwriters',
          'cache_last_premium',
          'policy_submission_guard',
        ];
        
        await Promise.all(
          motor2CacheKeys.map(key => AsyncStorage.removeItem(key).catch(() => {}))
        );
        
        // Also clear dynamic subcategory caches
        const allKeys = await AsyncStorage.getAllKeys();
        const subcategoryCacheKeys = allKeys.filter(key => 
          key.startsWith('motor_subcategories_') || 
          key.startsWith('cache_underwriters_') ||
          key.startsWith('cache_pricing_')
        );
        await Promise.all(
          subcategoryCacheKeys.map(key => AsyncStorage.removeItem(key).catch(() => {}))
        );
        
        console.log('✅ All Motor insurance caches cleared from storage');
      } catch (error) {
        console.warn('⚠️ Failed to clear persisted state:', error);
      }
    },
    
    // DMVIC actions (Phase 3.2)
    setExistingCoverData: (data) => {
      dispatch({ type: 'SET_EXISTING_COVER_DATA', payload: data });
    },
    
    setMinCoverStartDate: (date) => {
      dispatch({ type: 'SET_MIN_COVER_START_DATE', payload: date });
    },
    
    setShowVerificationScreen: (show) => {
      dispatch({ type: 'SET_SHOW_VERIFICATION_SCREEN', payload: show });
    },
    hasDMVICProcessed: (reg) => !!state.dmvicProcessedRegMap[(reg || '').toUpperCase().trim()],
    markDMVICProcessed: (reg) => {
      const norm = (reg || '').toUpperCase().trim();
      if (!norm) return;
      dispatch({ type: 'MARK_DMVIC_PROCESSED', payload: norm });
    },
    
    getCachedDMVICResult: (regNumber) => {
      const cached = state.dmvicCache[regNumber];
      const isValid = cached && (Date.now() - cached.timestamp < state.dmvicCacheTTL);
      return isValid ? cached.result : null;
    },
    
    cacheDMVICResult: (regNumber, result) => {
      dispatch({
        type: 'CACHE_DMVIC_RESULT',
        payload: { regNumber, result },
      });
    },
    
    clearDMVICCache: () => {
      dispatch({ type: 'CLEAR_DMVIC_CACHE' });
    },
    
    undo: () => dispatch({ type: 'UNDO' }),
    redo: () => dispatch({ type: 'REDO' }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [state.productType, state.vehicleDetails, state.pricingInputs]);

  const value = useMemo(() => ({ state, dispatch, actions }), [state, actions]);
  return <MotorInsuranceContext.Provider value={value}>{children}</MotorInsuranceContext.Provider>;
}

export function useMotorInsurance() {
  const ctx = useContext(MotorInsuranceContext);
  if (!ctx) throw new Error('useMotorInsurance must be used within MotorInsuranceProvider');
  return ctx;
}
