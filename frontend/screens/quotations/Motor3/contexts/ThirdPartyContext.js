import React, { createContext, useContext, useMemo, useReducer } from 'react';

const ThirdPartyContext = createContext(null);

const initialState = {
  // Product selection
  selectedProduct: null, // Subcategory details from Step1b
  
  // Vehicle identification
  registrationNumber: '',
  identificationType: 'Vehicle Registration', // or 'Chassis Number'
  chasisNumber: '',
  
  // Cover details
  cover_start_date: '',
  financialInterest: 'No',
  
  // DMVIC data (auto-filled, locked)
  dmvicData: null,
  isDataLocked: false,
  
  // Auto-filled fields from DMVIC (locked when dmvicData exists)
  make: '',
  model: '',
  year: '',
  color: '',
  logbookNumber: '',
  engineNumber: '',
  
  // Underwriter selection
  availableUnderwriters: [],
  selectedUnderwriter: null,
  loadingUnderwriters: false,
  
  // Validation
  errors: {},
};

function thirdPartyReducer(state, action) {
  switch (action.type) {
    case 'SET_SELECTED_PRODUCT':
      return {
        ...state,
        selectedProduct: action.payload,
      };
    
    case 'UPDATE_FIELD':
      return {
        ...state,
        [action.payload.field]: action.payload.value,
        errors: {
          ...state.errors,
          [action.payload.field]: null, // Clear error on change
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
    
    case 'LOCK_DMVIC_DATA':
      return {
        ...state,
        dmvicData: action.payload,
        isDataLocked: true,
        // Auto-fill fields from DMVIC
        make: action.payload.make || state.make,
        model: action.payload.model || state.model,
        year: action.payload.year || state.year,
        color: action.payload.color || state.color,
        logbookNumber: action.payload.logbook_number || state.logbookNumber,
        engineNumber: action.payload.engine_number || state.engineNumber,
        registrationNumber: action.payload.registration_number || state.registrationNumber,
        chasisNumber: action.payload.chassis_number || action.payload.chassisNumber || state.chasisNumber,
      };
    
    case 'UNLOCK_DMVIC_DATA':
      return {
        ...state,
        dmvicData: null,
        isDataLocked: false,
      };
    
    case 'SET_UNDERWRITERS':
      return {
        ...state,
        availableUnderwriters: action.payload,
        loadingUnderwriters: false,
      };
    
    case 'SET_LOADING_UNDERWRITERS':
      return {
        ...state,
        loadingUnderwriters: action.payload,
      };
    
    case 'SELECT_UNDERWRITER':
      return {
        ...state,
        selectedUnderwriter: action.payload,
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

export function ThirdPartyProvider({ children }) {
  const [state, dispatch] = useReducer(thirdPartyReducer, initialState);
  
  // Memoized helper functions
  const helpers = useMemo(() => ({
    setSelectedProduct: (product) => {
      dispatch({ type: 'SET_SELECTED_PRODUCT', payload: product });
    },
    setUnderwriters: (underwriters) => {
      dispatch({ type: 'SET_UNDERWRITERS', payload: underwriters });
    },
    selectUnderwriter: (underwriter) => {
      dispatch({ type: 'SELECT_UNDERWRITER', payload: underwriter });
    },
    updateField: (field, value) => {
      dispatch({ type: 'UPDATE_FIELD', payload: { field, value } });
    },
    updateMultipleFields: (fields) => {
      dispatch({ type: 'UPDATE_MULTIPLE_FIELDS', payload: fields });
    },
    // Backward compatibility (some screens call updateFormData)
    updateFormData: (fields) => {
      dispatch({ type: 'UPDATE_MULTIPLE_FIELDS', payload: fields });
    },
    lockDMVICData: (data) => {
      dispatch({ type: 'LOCK_DMVIC_DATA', payload: data });
    },
    unlockDMVICData: () => {
      dispatch({ type: 'UNLOCK_DMVIC_DATA' });
    },
    setErrors: (errors) => {
      dispatch({ type: 'SET_ERRORS', payload: errors });
    },
    clearError: (field) => {
      dispatch({ type: 'CLEAR_ERROR', payload: field });
    },
    resetForm: () => {
      dispatch({ type: 'RESET' });
    },
  }), []);
  
  const value = useMemo(() => ({ 
    ...state,
    ...helpers,
    state, 
    dispatch,
    formData: state // Alias for backward compatibility
  }), [state, helpers]);
  
  return (
    <ThirdPartyContext.Provider value={value}>
      {children}
    </ThirdPartyContext.Provider>
  );
}

export const useThirdParty = () => {
  const context = useContext(ThirdPartyContext);
  if (!context) {
    throw new Error('useThirdParty must be used within ThirdPartyProvider');
  }
  return context;
};
