import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../../constants';
import { SafeScreen, CompactCurvedHeader } from '../../components';
import { authAPI } from '../../services/auth';

export default function SignupScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // Only the fields required by Django RegisterPublicUserSerializer
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('AGENT'); // AGENT or CUSTOMER
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneValidation, setPhoneValidation] = useState({ 
    isValidating: false, 
    isValid: null, 
    message: '' 
  });

  // Normalize phone number - accepts both 9 and 10 digits (with leading 0)
  const normalizePhoneNumber = (phone) => {
    const cleanPhone = phone.replace(/\D/g, ''); // Remove non-digits
    
    // If starts with 0 and is 10 digits, strip the 0
    if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
      return cleanPhone.slice(1); // Return 9 digits
    }
    
    return cleanPhone;
  };

  // Validate phone number in real-time
  const validatePhoneNumber = async (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Reset validation state first
    setPhoneValidation({ isValidating: false, isValid: null, message: '' });
    
    // Basic format validation
    if (cleanPhone.length === 0) {
      return; // Don't validate empty field
    }
    
    // Accept both 9 digits (712345678) and 10 digits with leading 0 (0712345678)
    const normalizedPhone = normalizePhoneNumber(cleanPhone);
    
    if (cleanPhone.length !== 9 && cleanPhone.length !== 10) {
      setPhoneValidation({ 
        isValidating: false, 
        isValid: false, 
        message: 'Enter 9 digits (712345678) or 10 digits (0712345678)' 
      });
      return;
    }
    
    if (normalizedPhone.length !== 9) {
      setPhoneValidation({ 
        isValidating: false, 
        isValid: false, 
        message: 'Phone number must be 9 digits without leading 0' 
      });
      return;
    }
    
    if (!/^\d{9}$/.test(normalizedPhone)) {
      setPhoneValidation({ 
        isValidating: false, 
        isValid: false, 
        message: 'Phone number must contain only digits' 
      });
      return;
    }
    
    // Check availability with backend (use normalized 9-digit format)
    try {
      setPhoneValidation({ isValidating: true, isValid: null, message: 'Checking availability...' });
      
      await authAPI.validatePhone(normalizedPhone);
      
      setPhoneValidation({ 
        isValidating: false, 
        isValid: true, 
        message: 'Phone number is available ✓' 
      });
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Phone number validation failed';
      setPhoneValidation({ 
        isValidating: false, 
        isValid: false, 
        message: errorMessage 
      });
    }
  };

  const handleSignup = async () => {
    // Basic validation
    if (!fullName.trim() || !email.trim() || !phoneNumber.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Check if phone validation passed
    if (phoneValidation.isValid === false) {
      Alert.alert('Error', phoneValidation.message || 'Please enter a valid phone number');
      return;
    }

    // Email validation (now required)
    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Normalize and validate phone number (accepts 9 or 10 digits)
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    
    if (normalizedPhone.length !== 9) {
      Alert.alert('Error', 'Please enter a valid phone number (e.g., 712345678 or 0712345678)');
      return;
    }

    // Ensure phone number contains only digits
    if (!/^\d{9}$/.test(normalizedPhone)) {
      Alert.alert('Error', 'Phone number must contain only digits');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const signupData = {
        phonenumber: normalizedPhone, // Use normalized 9-digit phone
        password: password,
        confirm_password: confirmPassword,
        user_role: selectedRole,
        email: email.trim(), // Email is now required
        full_names: fullName.trim(),
      };

      console.log('📤 Signup Data Being Sent:', JSON.stringify(signupData, null, 2));

      const result = await authAPI.signup(signupData);

      console.log('📥 Signup Response Received:', JSON.stringify(result, null, 2));

      // Check Django response format: {"detail": "user created successfully.", "user_id": "..."}
      if (result.detail && result.detail.includes('created successfully')) {
        Alert.alert(
          'Success', 
          'Account created successfully! You can now sign in.',
          [
            {
              text: 'Sign In',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      } else if (result.user_id || result.id) {
        // Some APIs return user_id or id on success without a detail message
        Alert.alert(
          'Success', 
          'Account created successfully! You can now sign in.',
          [
            {
              text: 'Sign In',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      } else {
        console.log('⚠️ Unexpected success response format:', result);
        Alert.alert('Signup Failed', result.error || result.detail || 'Registration failed');
      }
    } catch (error) {
      console.log('❌ Signup error:', error);
      console.log('❌ Error response:', error.response);
      console.log('❌ Error data:', error.response?.data);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      // Handle specific Django validation errors
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Check if errors are nested in a 'details' object
        const errors = errorData.details || errorData;
        
        // Handle field-specific validation errors
        if (errors.phonenumber && errors.phonenumber[0]) {
          errorMessage = errors.phonenumber[0];
        } else if (errors.email && errors.email[0]) {
          errorMessage = errors.email[0];
        } else if (errors.password && errors.password[0]) {
          errorMessage = errors.password[0];
        } else if (errors.confirm_password && errors.confirm_password[0]) {
          errorMessage = errors.confirm_password[0];
        } else if (errors.full_names && errors.full_names[0]) {
          errorMessage = errors.full_names[0];
        } else if (errors.user_role && errors.user_role[0]) {
          errorMessage = errors.user_role[0];
        } else if (errors.non_field_errors && errors.non_field_errors[0]) {
          // Handle general validation errors like "Passwords do not match"
          errorMessage = errors.non_field_errors[0];
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeScreen backgroundColor="transparent" disableTopPadding>
      <StatusBar style="light" />
      {/* Consistent CompactCurvedHeader */}
      <CompactCurvedHeader 
        title="Pata Bima Agency"
        subtitle="Insurance for protection"
        showLogo={true}
        logoSource={require('../../assets/PataLogo.png')}
      />

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Let's sign You Up</Text>
          <Text style={styles.subtitle}>Welcome to Pata BimaAgency</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              placeholderTextColor={Colors.textLight}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={Colors.textLight}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input, 
                phoneValidation.isValid === true && styles.inputValid,
                phoneValidation.isValid === false && styles.inputInvalid
              ]}
              placeholder="0722123456 or 722123456"
              value={phoneNumber}
              onChangeText={(text) => {
                setPhoneNumber(text);
                // Validate after a short delay to avoid too many API calls
                clearTimeout(window.phoneValidationTimeout);
                window.phoneValidationTimeout = setTimeout(() => {
                  validatePhoneNumber(text);
                }, 800);
              }}
              keyboardType="phone-pad"
              maxLength={10}
              placeholderTextColor={Colors.textLight}
            />
            {phoneValidation.message && (
              <Text style={[
                styles.validationMessage,
                phoneValidation.isValid === true && styles.validationSuccess,
                phoneValidation.isValid === false && styles.validationError
              ]}>
                {phoneValidation.message}
              </Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor={Colors.textLight}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
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

          <View style={styles.inputContainer}>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                placeholderTextColor={Colors.textLight}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                accessibilityLabel={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                  size={24} 
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Account Type Selection with Checkboxes */}
          <View style={styles.inputContainer}>
            <Text style={styles.accountTypeLabel}>Account Type</Text>
            <View style={styles.accountTypeContainer}>
              <TouchableOpacity 
                style={styles.checkboxOption}
                onPress={() => setSelectedRole('AGENT')}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={selectedRole === 'AGENT' ? "checkbox" : "square-outline"} 
                  size={22} 
                  color={selectedRole === 'AGENT' ? Colors.primary : '#999'}
                />
                <Text style={[styles.checkboxLabel, selectedRole === 'AGENT' && styles.checkboxLabelActive]}>Agent</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.checkboxOption}
                onPress={() => setSelectedRole('CUSTOMER')}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={selectedRole === 'CUSTOMER' ? "checkbox" : "square-outline"} 
                  size={22} 
                  color={selectedRole === 'CUSTOMER' ? Colors.primary : '#999'}
                />
                <Text style={[styles.checkboxLabel, selectedRole === 'CUSTOMER' && styles.checkboxLabelActive]}>Customer</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={[
              styles.signUpButton,
              (isLoading || phoneValidation.isValid === false) && styles.signUpButtonDisabled
            ]}
            onPress={handleSignup}
            disabled={isLoading || phoneValidation.isValid === false}
            activeOpacity={0.8}
          >
            <Text style={styles.signUpButtonText}>
              {isLoading ? 'Signing Up...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
      </SafeScreen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  curvedHeader: {
    backgroundColor: Colors.primary,
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    height: 120, // Reduced height for better fitting
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    justifyContent: 'center',
  },
  horizontalLogoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  logoContainer: {
    width: 60,
    height: 60,
    backgroundColor: Colors.background,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  textSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  logo: {
    width: 40,
    height: 40,
  },
  agencyText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.background,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  taglineText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.background,
    opacity: 0.9,
  },
  scrollContent: {
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
    shadowOffset: {
      width: 0,
      height: 1,
    },
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
    shadowOffset: {
      width: 0,
      height: 1,
    },
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
  signUpButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    width: '100%',
    minHeight: 56,
  },
  signUpButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  signInText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  signInLink: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primary,
  },
  // Checkbox account type styles
  accountTypeLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  accountTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 24,
    paddingHorizontal: 4,
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  checkboxLabel: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  checkboxLabelActive: {
    color: Colors.primary,
    fontFamily: Typography.fontFamily.semiBold,
  },
  // Gender selection styles
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.textLight,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genderButtonText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  genderButtonTextActive: {
    color: Colors.background,
  },
  inputValid: {
    borderColor: '#28a745',
    borderWidth: 1,
  },
  inputInvalid: {
    borderColor: '#dc3545',
    borderWidth: 1,
  },
  validationMessage: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    marginTop: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  validationSuccess: {
    color: '#28a745',
  },
  validationError: {
    color: '#dc3545',
  },
  signUpButtonDisabled: {
    backgroundColor: Colors.textLight,
    opacity: 0.6,
  },
});
