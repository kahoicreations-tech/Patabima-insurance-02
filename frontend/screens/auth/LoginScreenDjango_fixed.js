import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, Typography } from '../../constants';

export default function LoginScreenDjango() {
  const navigation = useNavigation();
  const { login: contextLogin, verifyOtp, error: contextError, clearError } = useAuth();

  // Form state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // OTP state
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  
  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Error state
  const [error, setError] = useState('');

  // Clear errors when unmounting
  useEffect(() => {
    return () => {
      clearError();
      setError('');
    };
  }, []);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  // Handle login - Step 1: Send OTP
  const handleLogin = async () => {
    // Prevent duplicate submissions
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      setError('');
      clearError();
      
      const result = await contextLogin(phoneNumber, password);
      
      if (result.success && result.requiresOtp) {
        setShowOtpInput(true);
        setResendTimer(60);
        Alert.alert(
          'OTP Sent',
          `A 6-digit verification code has been sent to your phone`,
          [{ text: 'OK' }]
        );
      } else if (!result.success) {
        setError(result.error || 'Login failed');
        Alert.alert('Login Failed', result.error || 'Please try again');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle OTP verification - Step 2: Verify and complete login
  const handleVerifyOtp = async () => {
    // Prevent duplicate submissions
    if (isSubmitting) return;
    
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      clearError();
      
      const result = await verifyOtp(phoneNumber, otp);
      
      if (result.success) {
        // Success - navigation will be handled by auth state change
        Alert.alert(
          'Login Successful',
          `Welcome back, ${result.user?.full_names || 'User'}!`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Small delay to prevent flickering
                setTimeout(() => {
                  setIsSubmitting(false);
                }, 100);
              },
            },
          ]
        );
      } else {
        setError(result.error || 'Invalid OTP');
        setIsSubmitting(false);
        Alert.alert('Verification Failed', result.error || 'Please try again');
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError('An unexpected error occurred');
      setIsSubmitting(false);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0 || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError('');
      clearError();
      
      const result = await contextLogin(phoneNumber, password);
      
      if (result.success && result.requiresOtp) {
        setResendTimer(60);
        Alert.alert('OTP Resent', 'A new verification code has been sent.');
      } else {
        setError(result.error || 'Failed to resend OTP');
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError('Failed to resend OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle back to login
  const handleBackToLogin = () => {
    setShowOtpInput(false);
    setOtp('');
    setError('');
    clearError();
  };

  // Memoized footer (terms + version) so countdown state changes don't trigger layout flicker
  const Footer = useMemo(() => (
    <>
      <View style={styles.termsContainer}>
        <Text style={styles.termsText}>Review our </Text>
        <TouchableOpacity>
          <Text style={styles.termsLink}>Terms and Policies</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.version}>PataBima - Ver 1.0.0</Text>
    </>
  ), []);

  // Separate resend label computation to avoid inline logic causing component churn
  const resendLabel = useMemo(() => resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code', [resendTimer]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>P</Text>
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>PATA BIMA AGENCY</Text>
              <Text style={styles.headerSubtitle}>Insurance for Protection</Text>
            </View>
          </View>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          {!showOtpInput ? (
            <>
              {/* Login Form */}
              <Text style={styles.title}>Welcome Back!</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>

              {(error || contextError) && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color={Colors.error} />
                  <Text style={styles.errorText}>{error || contextError}</Text>
                </View>
              )}

              {/* Phone Number Input */}
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number (e.g., 0712345678)"
                  placeholderTextColor={Colors.textSecondary}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  editable={!isSubmitting}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={Colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!isSubmitting}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => navigation.navigate('ForgotPassword')}
                disabled={isSubmitting}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, isSubmitting && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              {/* Sign Up Link */}
              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Don't have an account? </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('SignupDjango')}
                  disabled={isSubmitting}
                >
                  <Text style={styles.signupLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {/* OTP Verification Form */}
              <Text style={styles.title}>Enter verification code</Text>
              <Text style={styles.subtitle}>
                We sent a 6-digit code to {phoneNumber}
              </Text>

              {(error || contextError) && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color={Colors.error} />
                  <Text style={styles.errorText}>{error || contextError}</Text>
                </View>
              )}

              {/* OTP Input */}
              <View style={styles.otpInputContainer}>
                <TextInput
                  style={styles.otpInput}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor={Colors.textSecondary}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!isSubmitting}
                  autoFocus
                />
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                style={[styles.loginButton, isSubmitting && styles.loginButtonDisabled]}
                onPress={handleVerifyOtp}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginButtonText}>Verify & Sign In</Text>
                )}
              </TouchableOpacity>

              {/* Resend OTP (isolated label) */}
              <TouchableOpacity
                style={styles.resendContainer}
                onPress={handleResendOtp}
                disabled={resendTimer > 0 || isSubmitting}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.resendText,
                  (resendTimer > 0 || isSubmitting) && styles.resendTextDisabled
                ]}>{resendLabel}</Text>
              </TouchableOpacity>

              {/* Back to Login */}
              <TouchableOpacity
                style={styles.backToLogin}
                onPress={handleBackToLogin}
                disabled={isSubmitting}
              >
                <Text style={styles.backToLoginText}>← Back to Login</Text>
              </TouchableOpacity>
            </>
          )}

          {Footer}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  logoText: {
    fontSize: 24,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
    marginBottom: Spacing.xs / 2,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize.xxl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '15',
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.error,
    marginLeft: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.lg,
  },
  forgotPasswordText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: '#FFFFFF',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  signupText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  signupLink: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primary,
  },
  otpInputContainer: {
    marginBottom: Spacing.lg,
  },
  otpInput: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  resendText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary,
  },
  resendTextDisabled: {
    color: Colors.textSecondary,
  },
  backToLogin: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  backToLoginText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  termsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: Spacing.md,
  },
  termsText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  termsLink: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary,
  },
  version: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
});
