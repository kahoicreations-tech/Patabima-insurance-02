import React, { createContext, useContext, useMemo, useReducer } from 'react';

import { getFlowType } from '../utils/productFieldConfig';

const Motor3Context = createContext(null);

const initialState = {
  // Flow routing
  selectedCategory: null,      // { code: 'PRIVATE', name: 'Private' }
  selectedSubcategory: null,   // { code: 'PRIVATE_THIRD_PARTY', pricing_model: 'FIXED' }
  flowType: null,              // 'THIRD_PARTY' | 'COMPREHENSIVE'

  // Cross-flow business inputs
  financialInterest: null,     // 'Yes' | 'No'
  clientDetailsSource: 'Logbook', // 'Logbook' | 'KRA PIN Certificate'
  vehicleDetailsSource: 'Logbook', // 'Logbook'

  // DMVIC / existing cover gate
  dmvicSearchResult: null,     // raw/normalized DMVIC response
  dmvicAcknowledged: false,
  
  // Global flow state
  currentStep: 0,
  completedSteps: [],
  
  // Client details (shared across all flows)
  clientDetails: {
    id_number: '',
    phone: '',
    email: '',
    address: '',
    first_name: '',
    last_name: '',
    kra_pin: '',
  },
  
  // Documents (shared)
  uploadedDocuments: [],
  
  // Payment
  paymentDetails: null,
  
  // Submission result
  policyNumber: null,
  quotationId: null,
  
  // UI Alerts
  snackbar: { visible: false, message: '', type: 'info' },

  // Loading & error states
  isLoading: false,
  error: null,
};

function motor3Reducer(state, action) {
  switch (action.type) {
    case 'SET_FLOW_TYPE':
      return {
        ...state,
        flowType: action.payload,
        currentStep: 0,
        completedSteps: [],
      };
    
    case 'SET_CATEGORY_SELECTION':
      return {
        ...state,
        selectedCategory: action.payload.category,
        selectedSubcategory: action.payload.subcategory,
        flowType: action.payload.flowType,
        // Reset DMVIC gate when product changes
        dmvicSearchResult: null,
        dmvicAcknowledged: false,
      };

    case 'SET_FINANCIAL_INTEREST':
      return {
        ...state,
        financialInterest: action.payload,
      };

    case 'SET_CLIENT_DETAILS_SOURCE':
      return {
        ...state,
        clientDetailsSource: action.payload,
      };

    case 'SET_VEHICLE_DETAILS_SOURCE':
      return {
        ...state,
        vehicleDetailsSource: action.payload,
      };

    case 'SET_DMVIC_SEARCH_RESULT':
      return {
        ...state,
        dmvicSearchResult: action.payload,
        dmvicAcknowledged: false,
      };

    case 'ACKNOWLEDGE_DMVIC':
      return {
        ...state,
        dmvicAcknowledged: true,
      };

    case 'RESET_DMVIC_ACKNOWLEDGEMENT':
      return {
        ...state,
        dmvicAcknowledged: false,
      };
    
    case 'UPDATE_CLIENT_DETAILS':
      return {
        ...state,
        clientDetails: {
          ...state.clientDetails,
          ...action.payload,
        },
      };
    
    case 'SET_CLIENT_DETAILS':
      return {
        ...state,
        clientDetails: action.payload,
      };
    
    case 'ADD_DOCUMENT':
      return {
        ...state,
        // Upsert by id so we don't accumulate duplicates when a doc transitions
        // selected -> uploaded -> validated.
        uploadedDocuments: [
          ...(state.uploadedDocuments || []).filter((d) => d?.id !== action.payload?.id),
          action.payload,
        ],
      };
    
    case 'REMOVE_DOCUMENT':
      return {
        ...state,
        uploadedDocuments: state.uploadedDocuments.filter(
          doc => doc.id !== action.payload
        ),
      };
    
    case 'SET_PAYMENT_DETAILS':
      return {
        ...state,
        paymentDetails: action.payload,
      };
    
    case 'SET_SUBMISSION_RESULT':
      return {
        ...state,
        policyNumber: action.payload.policyNumber,
        quotationId: action.payload.quotationId,
      };

    case 'SET_SNACKBAR':
      return {
        ...state,
        snackbar: action.payload,
      };
    
    case 'SET_CURRENT_STEP':
      return {
        ...state,
        currentStep: action.payload,
        completedSteps: [...new Set([...state.completedSteps, state.currentStep])],
      };
    
    case 'GO_BACK':
      return {
        ...state,
        currentStep: Math.max(0, state.currentStep - 1),
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    
    case 'RESET_FLOW':
      return initialState;
    
    default:
      return state;
  }
}

export function Motor3Provider({ children }) {
  const [state, dispatch] = useReducer(motor3Reducer, initialState);
  
  // Memoized helper functions
  const helpers = useMemo(() => ({
    setCategorySelection: (category, subcategory) => {
      const flowType = subcategory?.subcategory_code
        ? getFlowType(subcategory.subcategory_code)
        : null;

      dispatch({
        type: 'SET_CATEGORY_SELECTION',
        payload: { category, subcategory, flowType },
      });
    },
    updateClientDetails: (details) => {
      dispatch({ type: 'UPDATE_CLIENT_DETAILS', payload: details });
    },
    setClientDetails: (details) => {
      dispatch({ type: 'SET_CLIENT_DETAILS', payload: details });
    },
    addDocument: (doc) => {
      dispatch({ type: 'ADD_DOCUMENT', payload: doc });
    },
    removeDocument: (docId) => {
      dispatch({ type: 'REMOVE_DOCUMENT', payload: docId });
    },
    setPaymentDetails: (details) => {
      dispatch({ type: 'SET_PAYMENT_DETAILS', payload: details });
    },
    setSubmissionResult: (result) => {
      dispatch({ type: 'SET_SUBMISSION_RESULT', payload: result });
    },

    showSnackbar: (message, type = 'info') => {
      dispatch({ type: 'SET_SNACKBAR', payload: { visible: true, message, type } });
    },
    hideSnackbar: () => {
      dispatch({ type: 'SET_SNACKBAR', payload: { visible: false, message: '', type: 'info' } });
    },

    setFinancialInterest: (value) => {
      dispatch({ type: 'SET_FINANCIAL_INTEREST', payload: value });
    },

    setClientDetailsSource: (value) => {
      dispatch({ type: 'SET_CLIENT_DETAILS_SOURCE', payload: value });
    },

    setVehicleDetailsSource: (value) => {
      dispatch({ type: 'SET_VEHICLE_DETAILS_SOURCE', payload: value });
    },

    setDMVICSearchResult: (result) => {
      dispatch({ type: 'SET_DMVIC_SEARCH_RESULT', payload: result });
    },
    acknowledgeDMVIC: () => {
      dispatch({ type: 'ACKNOWLEDGE_DMVIC' });
    },
    resetDMVICAcknowledgement: () => {
      dispatch({ type: 'RESET_DMVIC_ACKNOWLEDGEMENT' });
    },
  }), []);
  
  // Memoized value to prevent unnecessary re-renders
  const value = useMemo(() => ({ 
    ...state,
    ...helpers,
    state, 
    dispatch 
  }), [state, helpers]);
  
  return (
    <Motor3Context.Provider value={value}>
      {children}
    </Motor3Context.Provider>
  );
}

export const useMotor3 = () => {
  const context = useContext(Motor3Context);
  if (!context) {
    throw new Error('useMotor3 must be used within Motor3Provider');
  }
  return context;
};
