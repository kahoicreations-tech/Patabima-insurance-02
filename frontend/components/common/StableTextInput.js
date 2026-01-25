import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { TextInput } from 'react-native';

/**
 * StableTextInput
 * 
 * A wrapper around TextInput that maintains local state to prevent cursor jumps
 * and focus loss when the parent component re-renders or when updates are debounced.
 * 
 * Features:
 * - Maintains local value state
 * - Debounces updates to parent
 * - Syncs with parent value only when necessary (external updates)
 * - Prevents focus loss by isolating high-frequency typing from heavy parent renders
 */
const StableTextInput = memo(({
  value,
  onChangeText,
  debounceMs = 300,
  ...props
}) => {
  const [localValue, setLocalValue] = useState(value || '');
  const timeoutRef = useRef(null);
  const lastSentValue = useRef(value);

  // Sync local state with parent value, but respect typing status
  useEffect(() => {
    // Only sync if the new prop value is different from what we last sent
    // This allows external updates (OCR) to pass through, but blocks echoes
    // Also check if it's different from localValue to avoid redundant updates
    if (value !== lastSentValue.current && value !== localValue) {
      setLocalValue(value || '');
      lastSentValue.current = value; // Update our baseline
    }
  }, [value, localValue]);

  const handleChangeText = useCallback((text) => {
    setLocalValue(text);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      lastSentValue.current = text; // Record what we are sending
      if (onChangeText) {
        onChangeText(text);
      }
    }, debounceMs);
  }, [onChangeText, debounceMs]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <TextInput
      {...props}
      value={localValue}
      onChangeText={handleChangeText}
      // Ensure we don't lose focus on submit unless explicitly requested
      blurOnSubmit={props.blurOnSubmit !== undefined ? props.blurOnSubmit : false}
    />
  );
});

export default StableTextInput;
