import React, { createContext, useContext, useMemo, useReducer } from 'react';

const ComprehensiveContext = createContext(null);

const initialState = {
  // Full vehicle details
  registrationNumber: '',
  identificationType: 'Vehicle Registration',
  make: '',
  make_other: '', // For "Other" make option
  model: '',
  model_other: '', // For "Other" model option
  year: '',
  color: '',
  bodyType: '',
  engineNumber: '',
  chasisNumber: '',
  logbookNumber: '',
  
  // Pricing inputs
  sum_insured: null,
  windscreen_value: null,
  radio_cassette_value: null,
  add_ons: [],
  instalment_option: '3_INSTALMENTS', // '3_INSTALMENTS' | '4_INSTALMENTS'
  
  // Cover details
  cover_start_date: '',
  financialInterest: 'No',
  purpose: 'PRIVATE_USE',
  
  // Underwriter selection (loaded after sum_insured entered)
  availableUnderwriters: [],
  selectedUnderwriter: null,
  comparingUnderwriters: false,
  
  // Add-ons (legacy aliases)
  selectedAddons: [],
  addonsPremium: 0,
  instalmentOption: '3_INSTALMENTS',
  
  // Validation
  errors: {},
};

function comprehensiveReducer(state, action) {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return {
        ...state,
        [action.payload.field]: action.payload.value,
        errors: {
          ...state.errors,
          [action.payload.field]: null,
        },
      };
    
    case 'UPDATE_MULTIPLE_FIELDS':
      const updates = {};
      const clearedErrors = { ...state.errors };
      
      Object.keys(action.payload).forEach(field => {
        updates[field] = action.payload[field];
        clearedErrors[field] = null;
      });
      
      return {
        ...state,
        ...updates,
        errors: clearedErrors,
      };
    
    case 'SET_UNDERWRITERS':
      return {
        ...state,
        availableUnderwriters: action.payload,
        comparingUnderwriters: false,
      };
    
    case 'SELECT_UNDERWRITER':
      return {
        ...state,
        selectedUnderwriter: action.payload,
      };
    
    case 'SET_COMPARING':
      return {
        ...state,
        comparingUnderwriters: action.payload,
      };
    
    case 'TOGGLE_ADDON':
      const addonId = action.payload;
      const isSelected = state.selectedAddons.includes(addonId);
      return {
        ...state,
        selectedAddons: isSelected
          ? state.selectedAddons.filter(id => id !== addonId)
          : [...state.selectedAddons, addonId],
      };
    
    case 'SET_ADDONS_PREMIUM':
      return {
        ...state,
        addonsPremium: action.payload,
      };
    
    case 'SET_INSTALMENT_OPTION':
      return {
        ...state,
        instalmentOption: action.payload,
      };
    
    case 'SET_ERRORS':
      return {
        ...state,
        errors: action.payload,
      };
    
    case 'CLEAR_ERROR':
      const { [action.payload]: removed, ...remainingErrors } = state.errors;
      return {
        ...state,
        errors: remainingErrors,
      };
    
    case 'RESET':
      return initialState;
    
    default:
      return state;
  }
}

export function ComprehensiveProvider({ children }) {
  const [state, dispatch] = useReducer(comprehensiveReducer, initialState);

  const helpers = useMemo(() => ({
    updateField: (field, value) => {
      dispatch({ type: 'UPDATE_FIELD', payload: { field, value } });
    },
    updateMultipleFields: (fields) => {
      dispatch({ type: 'UPDATE_MULTIPLE_FIELDS', payload: fields });
    },
    setVehicleDetails: (details) => {
      dispatch({ type: 'UPDATE_MULTIPLE_FIELDS', payload: details });
    },
    setPricingInputs: (inputs) => {
      const next = { ...inputs };

      // Keep legacy aliases in sync if callers use the newer keys.
      if (Array.isArray(next.add_ons)) {
        next.selectedAddons = next.add_ons;
      }
      if (next.instalment_option) {
        next.instalmentOption = next.instalment_option;
      }

      dispatch({ type: 'UPDATE_MULTIPLE_FIELDS', payload: next });
    },
    setUnderwriters: (underwriters) => {
      dispatch({ type: 'SET_UNDERWRITERS', payload: underwriters });
    },
    setSelectedUnderwriter: (underwriter) => {
      dispatch({ type: 'SELECT_UNDERWRITER', payload: underwriter });
    },
    reset: () => {
      dispatch({ type: 'RESET' });
    },
  }), []);

  const derived = useMemo(() => {
    const vehicleDetails = {
      registrationNumber: state.registrationNumber,
      identificationType: state.identificationType,
      cover_start_date: state.cover_start_date,
      make: state.make,
      make_other: state.make_other,
      model: state.model,
      model_other: state.model_other,
      year: state.year,
      color: state.color,
      bodyType: state.bodyType,
      engineNumber: state.engineNumber,
      chasisNumber: state.chasisNumber,
      logbookNumber: state.logbookNumber,
      financialInterest: state.financialInterest,
      purpose: state.purpose,
    };

    const pricingInputs = {
      sum_insured: state.sum_insured,
      windscreen_value: state.windscreen_value,
      radio_cassette_value: state.radio_cassette_value,
      add_ons: Array.isArray(state.add_ons) ? state.add_ons : state.selectedAddons,
      instalment_option: state.instalment_option || state.instalmentOption,
    };

    return {
      vehicleDetails,
      pricingInputs,
      underwriters: state.availableUnderwriters,
      selectedUnderwriter: state.selectedUnderwriter,
    };
  }, [state]);

  const value = useMemo(
    () => ({
      ...state,
      ...derived,
      ...helpers,
      state,
      dispatch,
    }),
    [state, derived, helpers]
  );
  
  return (
    <ComprehensiveContext.Provider value={value}>
      {children}
    </ComprehensiveContext.Provider>
  );
}

export const useComprehensive = () => {
  const context = useContext(ComprehensiveContext);
  if (!context) {
    throw new Error('useComprehensive must be used within ComprehensiveProvider');
  }
  return context;
};

// Alias used by Comprehensive flow screens
export const useComprehensiveContext = useComprehensive;
