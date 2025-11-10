import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useMotorFormField - Custom hook for managing Motor2 form fields with stable handlers
 * 
 * This hook provides:
 * - Stable change handlers that don't recreate on every render
 * - Debounced parent notifications to prevent excessive re-renders
 * - Real-time validation with immediate error display
 * - Ref-based latest value access without dependency issues
 * 
 * @param {Object} config
 * @param {string} config.name - Field name for parent notification
 * @param {any} config.initialValue - Initial field value
 * @param {Function} config.validate - Validation function: (value) => error string | null
 * @param {Function} config.onNotify - Parent notification callback: (fieldName, fieldValue) => void
 * @param {number} config.debounceMs - Debounce delay for parent notifications (default: 250ms)
 * @returns {Object} { value, error, handleChange, setValue, setError, resetError, latestValue }
 */
export const useMotorFormField = ({
  name,
  initialValue = '',
  validate = null,
  onNotify = null,
  debounceMs = 250,
}) => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState(null);
  
  // Ref to track latest value without causing re-renders
  const latestValueRef = useRef(initialValue);
  const notifyTimeoutRef = useRef(null);
  
  // Update ref when value changes
  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (notifyTimeoutRef.current) {
        clearTimeout(notifyTimeoutRef.current);
      }
    };
  }, []);
  
  /**
   * Stable change handler - never recreates
   * Updates value, validates, and notifies parent with debounce
   */
  const handleChange = useCallback((newValue) => {
    // Update ref immediately (synchronous - no re-render)
    latestValueRef.current = newValue;
    
    // Update state (triggers re-render)
    setValue(newValue);
    
    // Validate if validator provided
    if (validate) {
      const validationError = validate(newValue);
      setError(validationError);
    }
    
    // Notify parent with debounce
    if (onNotify) {
      // Clear existing timeout
      if (notifyTimeoutRef.current) {
        clearTimeout(notifyTimeoutRef.current);
      }
      
      // Schedule notification
      notifyTimeoutRef.current = setTimeout(() => {
        onNotify(name, newValue);
      }, debounceMs);
    }
  }, [name, validate, onNotify, debounceMs]);
  
  /**
   * Reset error state
   */
  const resetError = useCallback(() => {
    setError(null);
  }, []);
  
  /**
   * Manually set value (for external updates like DMVIC auto-fill)
   */
  const setValueManually = useCallback((newValue) => {
    latestValueRef.current = newValue;
    setValue(newValue);
    
    // Validate the new value
    if (validate) {
      const validationError = validate(newValue);
      setError(validationError);
    }
    
    // Notify parent immediately (no debounce for external updates)
    if (onNotify) {
      onNotify(name, newValue);
    }
  }, [name, validate, onNotify]);
  
  return {
    value,
    error,
    handleChange,
    setValue: setValueManually,
    setError,
    resetError,
    latestValue: latestValueRef.current,
  };
};

/**
 * useStableCallback - Helper hook to create stable callbacks
 * Useful for callbacks passed to memoized components
 * 
 * @param {Function} callback - Callback function
 * @returns {Function} Stable callback reference
 */
export const useStableCallback = (callback) => {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  return useCallback((...args) => {
    return callbackRef.current(...args);
  }, []);
};
