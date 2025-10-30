/**
 * React Hooks for Debouncing
 * 
 * Provides debouncing functionality to optimize form validation
 * and reduce unnecessary re-renders in Motor 2 insurance flow.
 * 
 * Features:
 * - Generic debounce hook for values
 * - Debounced callback hook for functions
 * - Configurable delay
 * - Automatic cleanup
 * 
 * @module useDebounce
 * @version 2.0
 */

import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Custom hook for debouncing values
 * Delays updating the debounced value until the specified delay has passed
 * since the last change.
 * 
 * @param {any} value - Value to debounce
 * @param {number} delay - Delay in milliseconds (default: 500ms)
 * @returns {any} Debounced value
 * 
 * @example
 * const [inputValue, setInputValue] = useState('');
 * const debouncedValue = useDebounce(inputValue, 500);
 * 
 * useEffect(() => {
 *   // This will only run 500ms after user stops typing
 *   validateField(debouncedValue);
 * }, [debouncedValue]);
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up the timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value changes before delay expires
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for debouncing callbacks
 * Returns a debounced version of the provided callback function.
 * Useful for debouncing event handlers.
 * 
 * @param {Function} callback - Callback function to debounce
 * @param {number} delay - Delay in milliseconds (default: 500ms)
 * @returns {Function} Debounced callback
 * 
 * @example
 * const handleInputChange = useDebouncedCallback((value) => {
 *   console.log('Input changed:', value);
 * }, 500);
 * 
 * <TextInput onChangeText={handleInputChange} />
 */
export function useDebouncedCallback(callback, delay = 500) {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback((...args) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]);
}

/**
 * Custom hook for debouncing with immediate first call
 * Similar to useDebounce but executes immediately on first call,
 * then debounces subsequent calls.
 * 
 * @param {any} value - Value to debounce
 * @param {number} delay - Delay in milliseconds (default: 500ms)
 * @returns {any} Debounced value
 * 
 * @example
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedQuery = useDebounceImmediate(searchQuery, 500);
 * 
 * // First search happens immediately, subsequent searches are debounced
 */
export function useDebounceImmediate(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const isFirstRun = useRef(true);

  useEffect(() => {
    // Execute immediately on first run
    if (isFirstRun.current) {
      setDebouncedValue(value);
      isFirstRun.current = false;
      return;
    }

    // Debounce subsequent runs
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for debouncing with loading state
 * Provides both debounced value and a loading indicator
 * 
 * @param {any} value - Value to debounce
 * @param {number} delay - Delay in milliseconds (default: 500ms)
 * @returns {Object} { debouncedValue, isDebouncing }
 * 
 * @example
 * const { debouncedValue, isDebouncing } = useDebounceWithLoading(inputValue, 500);
 * 
 * {isDebouncing && <ActivityIndicator />}
 */
export function useDebounceWithLoading(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    setIsDebouncing(true);

    const handler = setTimeout(() => {
      setDebouncedValue(value);
      setIsDebouncing(false);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return { debouncedValue, isDebouncing };
}

/**
 * Custom hook for throttling values
 * Unlike debounce, throttle ensures the function is called at most once
 * per specified interval.
 * 
 * @param {any} value - Value to throttle
 * @param {number} interval - Minimum interval in milliseconds (default: 500ms)
 * @returns {any} Throttled value
 * 
 * @example
 * const throttledValue = useThrottle(scrollPosition, 100);
 * // Value updates at most every 100ms
 */
export function useThrottle(value, interval = 500) {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= interval) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, interval - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, interval]);

  return throttledValue;
}

export default useDebounce;
