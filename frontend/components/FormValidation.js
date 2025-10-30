// Form Validation with Animations for PataBima App
// Provides animated form validation feedback

import React, { useState, useRef, useEffect } from 'react';
import { Animated, Text, View, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../constants';

export const useFormValidation = (validationRules) => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const animatedValues = useRef({}).current;

  // Initialize animated values for each field
  useEffect(() => {
    Object.keys(validationRules).forEach(field => {
      if (!animatedValues[field]) {
        animatedValues[field] = new Animated.Value(0);
      }
    });
  }, [validationRules]);

  const validateField = (fieldName, value) => {
    const rules = validationRules[fieldName];
    if (!rules) return null;

    for (const rule of rules) {
      const isValid = rule.validator(value);
      if (!isValid) {
        return rule.message;
      }
    }
    return null;
  };

  const validateForm = (formData) => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
        
        // Trigger shake animation
        shakeField(fieldName);
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const validateSingleField = (fieldName, value) => {
    const error = validateField(fieldName, value);
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));

    if (error) {
      shakeField(fieldName);
    }

    return !error;
  };

  const shakeField = (fieldName) => {
    const animatedValue = animatedValues[fieldName];
    if (!animatedValue) return;

    animatedValue.setValue(0);
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const setFieldTouched = (fieldName) => {
    setTouched(prev => ({
      ...prev,
      [fieldName]: true
    }));
  };

  const clearErrors = () => {
    setErrors({});
    setTouched({});
  };

  const getFieldError = (fieldName) => {
    return touched[fieldName] ? errors[fieldName] : null;
  };

  const getAnimatedStyle = (fieldName) => {
    const animatedValue = animatedValues[fieldName];
    if (!animatedValue) return {};

    return {
      transform: [{
        translateX: animatedValue
      }]
    };
  };

  return {
    errors,
    touched,
    validateForm,
    validateSingleField,
    setFieldTouched,
    clearErrors,
    getFieldError,
    getAnimatedStyle,
    hasErrors: Object.keys(errors).length > 0
  };
};

// Animated Input Component with Validation
export const AnimatedInput = ({ 
  label, 
  value, 
  onChangeText, 
  onBlur,
  fieldName,
  error,
  animatedStyle,
  placeholder,
  secureTextEntry,
  keyboardType,
  multiline,
  numberOfLines,
  style,
  ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (error) {
      // Animate error appearance
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      // Animate error disappearance
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [error]);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (onBlur) onBlur();
  };

  const getBorderColor = () => {
    if (error) return Colors.error;
    if (isFocused) return Colors.primary;
    return Colors.border;
  };

  return (
    <Animated.View style={[styles.inputContainer, animatedStyle, style]}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      
      <Animated.TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={[
          styles.input,
          multiline && styles.multilineInput,
          { borderColor: getBorderColor() }
        ]}
        placeholderTextColor={Colors.textLight}
        {...props}
      />
      
      {error && (
        <Animated.View 
          style={[
            styles.errorContainer,
            {
              opacity: fadeAnim,
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-10, 0]
                })
              }]
            }
          ]}
        >
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
};

// Success Animation Component
export const SuccessAnimation = ({ visible, message, onComplete }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          })
        ]),
        Animated.delay(2000),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          })
        ])
      ]).start(() => {
        if (onComplete) onComplete();
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.successContainer,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <Text style={styles.successIcon}>✅</Text>
      <Text style={styles.successMessage}>{message}</Text>
    </Animated.View>
  );
};

// Loading Animation Component
export const LoadingAnimation = ({ visible, message }) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Start opacity animation
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Start spinning animation
      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      
      spinAnimation.start();

      return () => {
        spinAnimation.stop();
      };
    } else {
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View 
      style={[
        styles.loadingContainer,
        { opacity: opacityAnim }
      ]}
    >
      <Animated.Text 
        style={[
          styles.loadingIcon,
          { transform: [{ rotate: spin }] }
        ]}
      >
        ⭕
      </Animated.Text>
      <Text style={styles.loadingMessage}>{message}</Text>
    </Animated.View>
  );
};

// Common validation rules
export const ValidationRules = {
  required: (message = 'This field is required') => ({
    validator: (value) => value && value.toString().trim().length > 0,
    message
  }),

  email: (message = 'Please enter a valid email address') => ({
    validator: (value) => {
      if (!value) return true; // Allow empty for optional fields
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message
  }),

  phone: (message = 'Please enter a valid phone number') => ({
    validator: (value) => {
      if (!value) return true; // Allow empty for optional fields
      const phoneRegex = /^(\+254|254|0)?[17]\d{8}$/;
      return phoneRegex.test(value.replace(/\s/g, ''));
    },
    message
  }),

  minLength: (min, message = `Minimum ${min} characters required`) => ({
    validator: (value) => !value || value.toString().length >= min,
    message
  }),

  maxLength: (max, message = `Maximum ${max} characters allowed`) => ({
    validator: (value) => !value || value.toString().length <= max,
    message
  }),

  number: (message = 'Please enter a valid number') => ({
    validator: (value) => {
      if (!value) return true; // Allow empty for optional fields
      return !isNaN(value) && !isNaN(parseFloat(value));
    },
    message
  }),

  positiveNumber: (message = 'Please enter a positive number') => ({
    validator: (value) => {
      if (!value) return true; // Allow empty for optional fields
      const num = parseFloat(value);
      return !isNaN(num) && num > 0;
    },
    message
  }),

  idNumber: (message = 'Please enter a valid ID number') => ({
    validator: (value) => {
      if (!value) return true; // Allow empty for optional fields
      return /^\d{7,8}$/.test(value);
    },
    message
  }),

  vehicleRegistration: (message = 'Please enter a valid registration number') => ({
    validator: (value) => {
      if (!value) return true; // Allow empty for optional fields
      const regexes = [
        /^K[A-Z]{2}\s?\d{3}[A-Z]$/, // KAA 123A
        /^[A-Z]{3}\s?\d{3}[A-Z]$/, // ABC 123A
      ];
      return regexes.some(regex => regex.test(value.toUpperCase()));
    },
    message
  }),

  custom: (validatorFn, message) => ({
    validator: validatorFn,
    message
  })
};

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorContainer: {
    marginTop: Spacing.xs,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    fontFamily: Typography.fontFamily.regular,
  },
  successContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -75 }, { translateY: -50 }],
    backgroundColor: Colors.success,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 1000,
  },
  successIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  successMessage: {
    color: 'white',
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    textAlign: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -75 }, { translateY: -50 }],
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  loadingMessage: {
    color: 'white',
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    textAlign: 'center',
  },
});

export default { useFormValidation, AnimatedInput, SuccessAnimation, LoadingAnimation, ValidationRules };
