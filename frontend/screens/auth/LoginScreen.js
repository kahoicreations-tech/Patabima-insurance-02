import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../../constants';
import { authAPI } from '../../services/auth';
import OTPService from '../../services/OTPService';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import djangoAPI from '../../services/DjangoAPIService';
import { SafeScreen, CompactCurvedHeader } from '../../components';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

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
  const [devTapCount, setDevTapCount] = useState(0);
  const [showBackendModal, setShowBackendModal] = useState(false);
  const [backendInput, setBackendInput] = useState('');
  const [effectiveBase, setEffectiveBase] = useState('');
  const [envBase, setEnvBase] = useState('');
  const [storedOverride, setStoredOverride] = useState('');
  const [pingResult, setPingResult] = useState('');

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

  // Hidden dev toggle: tap version 7x to open backend switcher
  const handleDevTap = async () => {
    const next = devTapCount + 1;
    setDevTapCount(next);
    if (next >= 7) {
      setDevTapCount(0);
      await populateBackendInfo();
      setShowBackendModal(true);
    }
  };

  const populateBackendInfo = useCallback(async () => {
    try {
      // Check Expo Constants first (works in built apps), then process.env (development)
      const expoExtra = Constants.expoConfig?.extra;
      let e = expoExtra?.apiBaseUrl || expoExtra?.apiUrl || '';
      
      // Fall back to process.env for development
      if (!e && typeof process !== 'undefined' && process.env) {
        e = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_URL || '';
      }
      
      setEnvBase(e);
      const stored = await AsyncStorage.getItem('api_base_url');
      setStoredOverride(stored || '');
      // Ensure service initialized to reflect current base
      try { await djangoAPI.initialize(); } catch {}
      setEffectiveBase(djangoAPI.baseUrl || '');
      setBackendInput((stored && stored.replace(/^override:/, '')) || djangoAPI.baseUrl || '');
      
      // Debug info for OTA update verification
      console.log('🔍 Backend Switcher Debug:');
      console.log('  Environment Base:', e || '(none)');
      console.log('  Stored Override:', stored || '(none)');
      console.log('  Effective Base:', djangoAPI.baseUrl || '(unknown)');
      console.log('  DjangoAPIService initialized:', !!djangoAPI.baseUrl);
      console.log('  OTA Update Timestamp:', new Date().toISOString());
      
      setPingResult('');
    } catch {}
  }, []);

  const saveBackendOverride = useCallback(async () => {
    const val = (backendInput || '').trim();
    if (!val || !/^https?:\/\//i.test(val)) {
      Alert.alert('Invalid URL', 'Enter a valid http(s) base URL, e.g. http://44.200.182.180');
      return;
    }
    try {
      await AsyncStorage.setItem('api_base_url', `override:${val}`);
      djangoAPI.updateBaseUrl(val.replace(/\/$/, ''));
      setEffectiveBase(djangoAPI.baseUrl);
      setStoredOverride(`override:${val}`);
      Alert.alert('Backend Updated', 'Using runtime override for backend base URL.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save override');
    }
  }, [backendInput]);

  const clearBackendOverride = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('api_base_url');
      await djangoAPI.initialize();
      setEffectiveBase(djangoAPI.baseUrl || '');
      setStoredOverride('');
      setBackendInput(djangoAPI.baseUrl || '');
      Alert.alert('Override Cleared', 'Reverted to environment/default backend.');
    } catch {}
  }, []);

  const testPing = useCallback(async () => {
    setPingResult('Testing endpoints...\n\n');
    try {
      const base = (djangoAPI.baseUrl || '').replace(/\/$/, '');
      const isHttps = base.startsWith('https://');
      
      // Updated endpoints to match actual backend routes
      const endpoints = [
        { name: 'Health', url: `${base}/api/v1/health/`, method: 'GET', critical: true },
        { name: 'Motor Categories', url: `${base}/api/v1/motor2/categories/`, method: 'GET', critical: true },
        { name: 'Auth Validate', url: `${base}/api/v1/public_app/auth/validate_phone`, method: 'POST', body: { phonenumber: '0790000000' }, critical: false },
      ];
      
      let results = [];
      let successCount = 0;
      let criticalFailed = false;
      
      for (const ep of endpoints) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);
          
          const options = {
            method: ep.method,
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' },
          };
          
          if (ep.body) {
            options.body = JSON.stringify(ep.body);
          }
          
          const response = await fetch(ep.url, options);
          clearTimeout(timeout);
          
          const statusEmoji = response.status === 200 || response.status === 201 ? '✅' : 
                             response.status >= 400 && response.status < 500 ? '⚠️' : '❌';
          
          results.push(`${statusEmoji} ${ep.name}: ${response.status}`);
          
          if (response.status === 200 || response.status === 201) {
            successCount++;
          } else if (ep.critical) {
            criticalFailed = true;
          }
          
          // Log response for debugging
          if (response.status === 200) {
            try {
              const json = await response.json();
              console.log(`[${ep.name}] Response:`, json);
            } catch {}
          }
        } catch (error) {
          const errMsg = error.name === 'AbortError' ? 'Timeout' : error.message || 'Network error';
          results.push(`❌ ${ep.name}: ${errMsg}`);
          if (ep.critical) {
            criticalFailed = true;
          }
        }
      }
      
      // Summary with SSL info
      const protocol = isHttps ? 'HTTPS ✅' : 'HTTP ⚠️';
      const summary = `\n━━━━━━━━━━━━━━━━━━━\n${protocol} | ${successCount}/${endpoints.length} OK\n${criticalFailed ? '⚠️ Critical endpoints failed!' : '✅ All critical endpoints OK'}`;
      
      setPingResult(results.join('\n') + summary);
    } catch (err) {
      setPingResult(`❌ Test failed: ${err?.message || 'unknown error'}`);
    }
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
      
      // Normalize phone number - ADD leading 0 if missing (10 digits required)
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
      let normalizedPhone = cleanPhoneNumber;
      
      // Add leading 0 if user entered 9 digits
      if (cleanPhoneNumber.length === 9 && !cleanPhoneNumber.startsWith('0')) {
        normalizedPhone = '0' + cleanPhoneNumber;
      }

      // Validate normalized phone is 10 digits with leading 0
      if (normalizedPhone.length !== 10 || !normalizedPhone.startsWith('0')) {
        Alert.alert('Error', 'Please enter a valid Kenyan phone number (0712345678)');
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
          // Keep loading state, show transitioning overlay
          setTransitioning(true);
          
          try { await djangoAPI.initialize(); } catch {}
          // Only call refreshAuthState - it will handle user profile fetching
          await refreshAuthState();
          
          // Navigation will happen automatically, cleanup after a moment
          setTimeout(() => {
            setIsLoading(false);
            setTransitioning(false);
          }, 300);
        } else {
          Alert.alert('Invalid OTP', 'The verification code you entered is incorrect. Please try again.');
          setIsLoading(false);
        }
      } catch (error) {
        console.log('OTP verification error:', error);
        setIsLoading(false);
        setTransitioning(false);
        let errorMessage = 'OTP verification failed. Please try again.';
        let errorTitle = 'Verification Failed';
        if (error.response?.status === 400) {
          if (error.response.data?.detail) errorMessage = error.response.data.detail;
        } else if (error.response?.status === 401) {
          errorTitle = 'Invalid OTP';
          errorMessage = 'The verification code is incorrect or has expired. Please try again.';
        }
        Alert.alert(errorTitle, errorMessage);
      }
    }
  };

  const handleResendOTP = async () => {
    if (otpTimer > 0) return;
    setIsLoading(true);
    try {
      // Use new OTPService
      const result = await OTPService.resendOTP(phoneNumber, 'LOGIN');
      
      if (result.success) {
        startOtpCountdown();
        // In development, show OTP code in alert
        const message = result.otpCode 
          ? `A new verification code has been sent: ${result.otpCode}`
          : 'A new verification code has been sent to your phone';
        Alert.alert('OTP Sent', message);
        
        // Auto-fill OTP in development
        if (result.otpCode) {
          setOtp(result.otpCode);
        }
      } else {
        const errorMsg = result.rateLimited 
          ? result.error 
          : 'Failed to resend OTP. Please try again.';
        Alert.alert('Error', errorMsg);
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

  // Memoize content container style to prevent re-renders causing flickering
  const contentContainerStyle = useMemo(() => {
    return {
      ...styles.content,
      paddingBottom: insets.bottom + 20
    };
  }, [insets.bottom]);

  // Memoize resend button styles to prevent flickering
  const resendButtonStyle = useMemo(() => {
    return [styles.resendButton, otpTimer > 0 && styles.resendButtonDisabled];
  }, [otpTimer]);

  const resendButtonTextStyle = useMemo(() => {
    return [styles.resendButtonText, otpTimer > 0 && styles.resendButtonTextDisabled];
  }, [otpTimer]);

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
              <Text style={styles.transitionText}>Loading your account...</Text>
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
            contentContainerStyle={contentContainerStyle}
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
                      placeholder="Mobile Number (e.g., 0712345678)"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      keyboardType="phone-pad"
                      maxLength={12}
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
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color={Colors.background} />
                    ) : (
                      <Text style={styles.signInButtonText}>Verify & Sign In</Text>
                    )}
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
                      style={resendButtonStyle}
                      onPress={handleResendOTP}
                      disabled={otpTimer > 0 || isLoading}
                      activeOpacity={0.7}
                    >
                      <Text style={resendButtonTextStyle}>
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
                  <TouchableOpacity activeOpacity={0.7}>
                    <Text style={styles.termsLink}>Terms and Policies</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.versionText} onPress={handleDevTap}>PataBima - Ver 1.0.0</Text>
              </View>
            </View>
          </ScrollView>
          <Modal visible={showBackendModal} transparent animationType="fade" onRequestClose={() => setShowBackendModal(false)}>
            <View style={styles.modalBackdrop}>
              <View style={[styles.modalCard, { maxHeight: '85%' }]}>
                <Text style={styles.modalTitle}>🔧 Backend Switcher - Dev Tools</Text>
                
                <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={true}>
                  {/* SSL & Environment Status */}
                  <View style={{ backgroundColor: djangoAPI.baseUrl?.startsWith('https://') ? '#e8f5e9' : '#fff3e0', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: djangoAPI.baseUrl?.startsWith('https://') ? '#4caf50' : '#ff9800' }}>
                    <Text style={[styles.modalLabel, { fontSize: 12, color: djangoAPI.baseUrl?.startsWith('https://') ? '#2e7d32' : '#e65100', fontWeight: 'bold', marginBottom: 8 }]}>
                      {djangoAPI.baseUrl?.startsWith('https://') ? '🔒 HTTPS ENABLED - SSL Certificate Active' : '⚠️ HTTP ONLY - No SSL Encryption'}
                    </Text>
                    <Text style={[styles.modalValue, { fontSize: 10, color: '#666' }]}>
                      {djangoAPI.baseUrl?.startsWith('https://') 
                        ? '✅ All API calls are encrypted and secure'
                        : '⚠️ Unencrypted connection - Use HTTPS in production'}
                    </Text>
                  </View>

                  {/* Current Configuration */}
                  <View style={{ backgroundColor: '#f5f5f5', padding: 10, borderRadius: 8, marginBottom: 12 }}>
                    <Text style={[styles.modalLabel, { fontSize: 11, color: '#666', fontWeight: 'bold', marginBottom: 8 }]}>📊 Current Configuration:</Text>
                    
                    <Text style={[styles.modalValue, { fontSize: 10, color: '#0066cc', fontWeight: 'bold', marginTop: 4 }]}>
                      🌐 Active URL: {djangoAPI.baseUrl || 'NONE'}
                    </Text>
                    
                    <Text style={[styles.modalValue, { fontSize: 10, color: envBase ? '#0a7' : '#D5222B', marginTop: 4 }]}>
                      📦 Environment: {envBase || '(not set)'}
                    </Text>
                    
                    <Text style={[styles.modalValue, { fontSize: 10, color: storedOverride ? '#ff9800' : '#999', marginTop: 4 }]}>
                      ⚙️ Override: {storedOverride ? storedOverride.replace('override:', '') : '(none)'}
                    </Text>
                  </View>

                  {/* Runtime Information */}
                  <View style={{ backgroundColor: '#f0f0f0', padding: 10, borderRadius: 8, marginBottom: 12 }}>
                    <Text style={[styles.modalLabel, { fontSize: 11, color: '#666', fontWeight: 'bold', marginBottom: 8 }]}>🔍 Runtime Information:</Text>
                    
                    <Text style={[styles.modalValue, { fontSize: 10, color: '#333', marginTop: 4 }]}>
                      📱 Build: 1.0.2 | {new Date().toLocaleString()}
                    </Text>
                    
                    <Text style={[styles.modalValue, { fontSize: 10, color: __DEV__ ? '#ff9800' : '#0a7', marginTop: 4 }]}>
                      🛠️ Mode: {__DEV__ ? 'DEVELOPMENT' : 'PRODUCTION'}
                    </Text>
                    
                    <Text style={[styles.modalValue, { fontSize: 10, color: djangoAPI.baseUrl ? '#0a7' : '#D5222B', marginTop: 4 }]}>
                      🔧 Django Service: {djangoAPI.baseUrl ? '✓ Initialized' : '✗ Not Initialized'}
                    </Text>
                    
                    <Text style={[styles.modalValue, { fontSize: 10, color: '#666', marginTop: 4 }]}>
                      🔑 Expo Config: {Constants.expoConfig ? '✓ Available' : '✗ Missing'}
                    </Text>
                  </View>

                  {/* Environment Variables Debug */}
                  <View style={{ backgroundColor: '#e3f2fd', padding: 10, borderRadius: 8, marginBottom: 12 }}>
                    <Text style={[styles.modalLabel, { fontSize: 11, color: '#1565c0', fontWeight: 'bold', marginBottom: 8 }]}>🌍 Environment Variables:</Text>
                    
                    <Text style={[styles.modalValue, { fontSize: 9, color: '#666', marginTop: 4, fontFamily: 'monospace' }]}>
                      EXPO_PUBLIC_API_BASE_URL:{'\n'}{typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_BASE_URL ? process.env.EXPO_PUBLIC_API_BASE_URL : 'undefined'}
                    </Text>
                    
                    <Text style={[styles.modalValue, { fontSize: 9, color: '#666', marginTop: 6, fontFamily: 'monospace' }]}>
                      Extra.apiBaseUrl:{'\n'}{Constants.expoConfig?.extra?.apiBaseUrl || 'undefined'}
                    </Text>
                    
                    <Text style={[styles.modalValue, { fontSize: 9, color: '#666', marginTop: 6, fontFamily: 'monospace' }]}>
                      Extra.apiUrl:{'\n'}{Constants.expoConfig?.extra?.apiUrl || 'undefined'}
                    </Text>
                  </View>

                  {/* Working Endpoints Reference */}
                  <View style={{ backgroundColor: '#f3e5f5', padding: 10, borderRadius: 8, marginBottom: 12 }}>
                    <Text style={[styles.modalLabel, { fontSize: 11, color: '#6a1b9a', fontWeight: 'bold', marginBottom: 8 }]}>✅ Known Working Endpoints:</Text>
                    
                    <Text style={[styles.modalValue, { fontSize: 9, color: '#666', marginTop: 4, fontFamily: 'monospace' }]}>
                      Health Check:{'\n'}/api/v1/health/
                    </Text>
                    
                    <Text style={[styles.modalValue, { fontSize: 9, color: '#666', marginTop: 6, fontFamily: 'monospace' }]}>
                      Motor Categories:{'\n'}/api/v1/motor2/categories/
                    </Text>
                    
                    <Text style={[styles.modalValue, { fontSize: 9, color: '#666', marginTop: 6, fontFamily: 'monospace' }]}>
                      Auth Login:{'\n'}/api/v1/public_app/auth/login
                    </Text>
                    
                    <Text style={[styles.modalValue, { fontSize: 9, color: '#666', marginTop: 6, fontFamily: 'monospace' }]}>
                      Validate Phone:{'\n'}/api/v1/public_app/auth/validate_phone
                    </Text>
                  </View>

                  {/* Manual Override Section */}
                  <View style={{ backgroundColor: '#fff9c4', padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#fbc02d' }}>
                    <Text style={[styles.modalLabel, { fontSize: 11, color: '#f57f17', fontWeight: 'bold', marginBottom: 8 }]}>⚠️ Manual Override (Dev Only):</Text>
                    
                    <TextInput
                      style={[styles.input, { fontSize: 11, padding: 8 }]}
                      placeholder="https://api.hugo-shopping.com"
                      value={backendInput}
                      onChangeText={setBackendInput}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                      <TouchableOpacity style={[styles.signInButton, { flex: 1, marginRight: 8, paddingVertical: 8 }]} onPress={saveBackendOverride}>
                        <Text style={[styles.signInButtonText, { fontSize: 11 }]}>Save Override</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.signInButton, { backgroundColor: '#666', flex: 1, marginLeft: 8, paddingVertical: 8 }]} onPress={clearBackendOverride}>
                        <Text style={[styles.signInButtonText, { fontSize: 11 }]}>Clear Override</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Test Endpoints Section */}
                  <View style={{ backgroundColor: '#e8f5e9', padding: 10, borderRadius: 8, marginBottom: 12 }}>
                    <Text style={[styles.modalLabel, { fontSize: 11, color: '#2e7d32', fontWeight: 'bold', marginBottom: 8 }]}>🧪 Endpoint Testing:</Text>
                    
                    <TouchableOpacity style={[styles.signInButton, { backgroundColor: '#0a7', paddingVertical: 10 }]} onPress={testPing}>
                      <Text style={[styles.signInButtonText, { fontSize: 12 }]}>🔍 Test All Endpoints</Text>
                    </TouchableOpacity>
                    
                    {pingResult ? (
                      <View style={{ backgroundColor: '#fff', padding: 8, borderRadius: 4, marginTop: 8, borderWidth: 1, borderColor: '#ddd' }}>
                        <Text style={[styles.modalValue, { fontSize: 9, fontFamily: 'monospace', color: '#333' }]}>{pingResult}</Text>
                      </View>
                    ) : null}
                  </View>
                </ScrollView>

                <TouchableOpacity onPress={() => setShowBackendModal(false)} style={[styles.signInButton, { marginTop: 12, backgroundColor: '#D5222B' }]}>
                  <Text style={styles.signInButtonText}>Close Dev Tools</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
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
    backgroundColor: 'rgba(255,255,255,0.95)',
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transitionText: {
    marginTop: 16,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '100%',
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  modalLabel: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  modalValue: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
  },
});
