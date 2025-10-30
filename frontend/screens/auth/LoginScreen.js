import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, ScrollView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../../constants';
import { authAPI } from '../../services/auth';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import djangoAPI from '../../services/DjangoAPIService';
import { SafeScreen, CompactCurvedHeader } from '../../components';

export default function LoginScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { refreshAuthState } = useAuth();
  const { fetchUser } = useAppData();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [loginStep, setLoginStep] = useState(1); // 1: credentials, 2: OTP
  const [otpTimer, setOtpTimer] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const passwordInputRef = useRef(null);
  const otpInputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const startOtpCountdown = () => {
    setOtpTimer(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setOtpTimer(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleLogin = async () => {
    if (loginStep === 1) {
      if (!phoneNumber.trim() || !password.trim()) {
        Alert.alert('Error', 'Please enter your phone number and password');
        return;
      }
      
      // Normalize phone number (strip leading 0 if 10 digits)
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
      const normalizedPhone = cleanPhoneNumber.startsWith('0') && cleanPhoneNumber.length === 10
        ? cleanPhoneNumber.substring(1)
        : cleanPhoneNumber;

      // Validate normalized phone is 9 digits
      if (normalizedPhone.length !== 9) {
        Alert.alert('Error', 'Please enter a valid phone number (9 or 10 digits)');
        return;
      }

      setIsLoading(true);
      try {
        const result = await authAPI.login(normalizedPhone, password);
        const message = result?.detail || result?.message || '';
        if (message.includes('OTP sent')) {
          setLoginStep(2);
          startOtpCountdown();
          if (result.otp_code) setOtp(result.otp_code);
          Alert.alert('OTP Sent', `Please check your phone for the verification code${result.otp_code ? `: ${result.otp_code}` : ''}`);
          // focus OTP
          setTimeout(() => otpInputRef.current?.focus(), 300);
        } else {
          Alert.alert('Login Failed', result.error || 'Invalid credentials');
        }
      } catch (error) {
        console.log('Login error:', error);
        let errorMessage = 'Login failed. Please try again.';
        let errorTitle = 'Error';
        if (error.response?.status === 400) {
          if (error.response.data?.detail) {
            errorMessage = error.response.data.detail;
            if (errorMessage.includes('User does not exist')) {
              errorTitle = 'Account Not Found';
              errorMessage = 'No account found with this phone number. Please check or sign up.';
            } else if (errorMessage.toLowerCase().includes('invalid credentials')) {
              errorTitle = 'Invalid Credentials';
              errorMessage = 'Incorrect phone number or password. Please try again.';
            }
          }
        } else if (error.response?.status === 401) {
          errorTitle = 'Authentication Error';
          errorMessage = 'Session expired. Please try logging in again.';
        } else if (error.response?.status === 500) {
          errorTitle = 'Server Error';
          errorMessage = 'Server is temporarily unavailable. Please try again later.';
        } else if (!error.response) {
          errorTitle = 'Connection Error';
          errorMessage = 'Unable to connect to server. Check your internet connection and try again.';
        }
        Alert.alert(errorTitle, errorMessage, [
          { text: 'OK', style: 'default' },
          ...(errorMessage.includes('sign up') ? [{ text: 'Sign Up', onPress: () => navigation.navigate('Signup') }] : [])
        ]);
      } finally {
        setIsLoading(false);
      }
    } else {
      // OTP step
      if (!otp.trim()) {
        Alert.alert('Error', 'Please enter the OTP code');
        return;
      }
      if (otp.length !== 6) {
        Alert.alert('Error', 'Please enter a valid 6-digit OTP');
        return;
      }

      setIsLoading(true);
      try {
        // Normalize phone number again for OTP verification
        const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
        const normalizedPhone = cleanPhoneNumber.startsWith('0') && cleanPhoneNumber.length === 10
          ? cleanPhoneNumber.substring(1)
          : cleanPhoneNumber;
        const result = await authAPI.authLogin(normalizedPhone, password, otp);
        if (result.access) {
          // Set transitioning for overlay only after successful login
          setIsLoading(false); // Stop button loading
          setTransitioning(true); // Show full-screen overlay
          
          try { await djangoAPI.initialize(); } catch {}
          // Only call refreshAuthState - it will handle user profile fetching
          await refreshAuthState();
          
          // Add a small delay to ensure navigation completes, then cleanup
          setTimeout(() => {
            setTransitioning(false);
          }, 500);
        } else {
          Alert.alert('Invalid OTP', 'The verification code you entered is incorrect. Please try again.');
          setIsLoading(false);
        }
      } catch (error) {
        console.log('OTP verification error:', error);
        setTransitioning(false); // Reset transitioning state on error
        let errorMessage = 'OTP verification failed. Please try again.';
        let errorTitle = 'Verification Failed';
        if (error.response?.status === 400) {
          if (error.response.data?.detail) errorMessage = error.response.data.detail;
        } else if (error.response?.status === 401) {
          errorTitle = 'Invalid OTP';
          errorMessage = 'The verification code is incorrect or has expired. Please try again.';
        }
        Alert.alert(errorTitle, errorMessage);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleResendOTP = async () => {
    if (otpTimer > 0) return;
    setIsLoading(true);
    try {
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
      const result = await authAPI.login(cleanPhoneNumber, password);
      const message = result?.detail || result?.message || '';
      if (message.includes('OTP sent')) {
        startOtpCountdown();
        Alert.alert('OTP Sent', 'A new verification code has been sent to your phone');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    setLoginStep(1);
    setOtp('');
    setOtpTimer(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <SafeScreen backgroundColor="transparent" disableTopPadding>
          {transitioning && (
            <View style={styles.transitionOverlay}>
              <ActivityIndicator size="large" color="#D5222B" />
            </View>
          )}
          <StatusBar style="light" />
          <CompactCurvedHeader
            title="Pata Bima Agency"
            subtitle="Insurance for protection"
            showLogo={true}
            logoSource={require('../../assets/PataLogo.png')}
          />

          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.headerContainer}>
              <Text style={styles.title}>
                {loginStep === 1 ? "Let's sign you in" : 'Enter verification code'}
              </Text>
              <Text style={styles.subtitle}>
                {loginStep === 1
                  ? "Welcome back, you've been missed"
                  : `We sent a 6-digit code to ${phoneNumber}`}
              </Text>
            </View>

            <View style={styles.formContainer}>
              {loginStep === 1 ? (
                <>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="0722123456 or 722123456"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      keyboardType="phone-pad"
                      maxLength={10}
                      placeholderTextColor={Colors.textLight}
                      returnKeyType="next"
                      autoCapitalize="none"
                      autoCorrect={false}
                      blurOnSubmit={false}
                      onSubmitEditing={() => passwordInputRef?.current?.focus()}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        ref={passwordInputRef}
                        style={styles.passwordInput}
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        placeholderTextColor={Colors.textLight}
                        returnKeyType="done"
                        autoCapitalize="none"
                        autoCorrect={false}
                        onSubmitEditing={handleLogin}
                      />
                      <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setShowPassword(!showPassword)}
                        activeOpacity={0.7}
                        accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                      >
                        <Ionicons 
                          name={showPassword ? "eye-off-outline" : "eye-outline"} 
                          size={24} 
                          color="#666"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.signInButton}
                    onPress={handleLogin}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.signInButtonText}>
                      {isLoading ? 'Signing In...' : 'Sign In'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.inputContainer}>
                    <TextInput
                      ref={otpInputRef}
                      style={styles.input}
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                      placeholderTextColor={Colors.textLight}
                      returnKeyType="done"
                      autoCapitalize="none"
                      autoCorrect={false}
                      onSubmitEditing={handleLogin}
                      autoFocus={true}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.signInButton}
                    onPress={handleLogin}
                    disabled={isLoading || transitioning}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.signInButtonText}>
                      {isLoading ? 'Verifying...' : transitioning ? 'Loading...' : 'Verify & Sign In'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.otpActions}>
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={handleBackToCredentials}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.backButtonText}>← Back to Login</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.resendButton, otpTimer > 0 && styles.resendButtonDisabled]}
                      onPress={handleResendOTP}
                      disabled={otpTimer > 0 || isLoading}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.resendButtonText, otpTimer > 0 && styles.resendButtonTextDisabled]}>
                        {otpTimer > 0 ? `Resend in ${otpTimer}s` : 'Resend OTP'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {loginStep === 1 && (
                <>
                  <TouchableOpacity
                    style={styles.forgotPasswordContainer}
                    onPress={() => navigation.navigate('ForgotPassword')}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
                  </TouchableOpacity>

                  <View style={styles.signUpContainer}>
                    <Text style={styles.signUpText}>Don't have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                      <Text style={styles.signUpLink}>Sign Up</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              <View style={styles.footerContainer}>
                <View style={styles.termsContainer}>
                  <Text style={styles.termsText}>Review our </Text>
                  <TouchableOpacity>
                    <Text style={styles.termsLink}>Terms and Policies</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.versionText}>PataBima - Ver 1.0.0</Text>
              </View>
            </View>
          </ScrollView>
        </SafeScreen>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  transitionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.85)',
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: Typography.fontSize.xxl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
    marginTop: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === 'ios' ? 16 : 14,
    borderRadius: 14,
    fontSize: 16,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    borderWidth: 0,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 14,
    borderWidth: 0,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === 'ios' ? 16 : 14,
    fontSize: 16,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
  },
  eyeIcon: {
    paddingHorizontal: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeText: {
    fontSize: 22,
    opacity: 0.7,
  },
  helpText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  signInButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    width: '100%',
    minHeight: 56,
  },
  signInButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  forgotPasswordText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  signUpText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  signUpLink: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primary,
  },
  footerContainer: {
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  termsText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.regular,
    color: '#888888',
  },
  termsLink: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary,
  },
  versionText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: '#AAAAAA',
    textAlign: 'center',
  },
  otpActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  resendButton: {
    padding: 8,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary,
  },
  resendButtonTextDisabled: {
    color: Colors.textLight,
  },
});
