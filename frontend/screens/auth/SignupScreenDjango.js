import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '../../constants';
import { authAPI } from '../../services/auth';

export default function SignupScreenDjango() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userRole, setUserRole] = useState('CUSTOMER');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Normalize phone number - accepts both 9 and 10 digits (with leading 0)
  const normalizePhoneNumber = (phone) => {
    const cleanPhone = phone.replace(/\D/g, ''); // Remove non-digits
    
    // If starts with 0 and is 10 digits, strip the 0
    if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
      return cleanPhone.slice(1); // Return 9 digits
    }
    
    return cleanPhone;
  };

  const handleSignup = async () => {
    // Validation
    if (!fullName.trim() || !phoneNumber.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
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

    if (email && !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      // Normalize phone number (accepts both 9 and 10 digits)
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      
      if (normalizedPhone.length !== 9) {
        Alert.alert('Error', 'Please enter a valid phone number (e.g., 0722123456 or 722123456)');
        setIsLoading(false);
        return;
      }

      const result = await authAPI.signup({
        phonenumber: normalizedPhone,
        full_names: fullName,
        email: email || null,
        user_role: userRole,
        password: password,
        confirm_password: confirmPassword,
      });

      if (result.success) {
        Alert.alert(
          'Account Created!', 
          `${result.message}\n\nUser ID: ${result.userId}\n\nYou can now login with your credentials.`,
          [
            { 
              text: 'Go to Login', 
              onPress: () => navigation.navigate('LoginDjango')
            }
          ]
        );
      } else {
        Alert.alert('Signup Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.log('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const goToLogin = () => {
    navigation.navigate('LoginDjango');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Image 
          source={require('../../assets/images/logo-white.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>
          Join PataBima for insurance solutions
        </Text>
      </View>

      {/* Form */}
      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Full Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor={Colors.textSecondary}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={Colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Phone Number */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 0722123456 or 722123456"
              placeholderTextColor={Colors.textSecondary}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              maxLength={10}
            />
            <Text style={styles.helpText}>
              Enter your Kenyan mobile number (with or without leading 0)
            </Text>
          </View>

          {/* User Role */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Account Type *</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  userRole === 'CUSTOMER' && styles.roleButtonActive
                ]}
                onPress={() => setUserRole('CUSTOMER')}
              >
                <Text style={[
                  styles.roleButtonText,
                  userRole === 'CUSTOMER' && styles.roleButtonTextActive
                ]}>
                  Customer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  userRole === 'AGENT' && styles.roleButtonActive
                ]}
                onPress={() => setUserRole('AGENT')}
              >
                <Text style={[
                  styles.roleButtonText,
                  userRole === 'AGENT' && styles.roleButtonTextActive
                ]}>
                  Agent
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter password (min 6 chars)"
                placeholderTextColor={Colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeText}>
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm your password"
                placeholderTextColor={Colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Text style={styles.eyeText}>
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Signup Button */}
          <TouchableOpacity 
            style={[styles.signupButton, isLoading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.signupButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={goToLogin}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Django Test Info */}
          <View style={styles.testInfo}>
            <Text style={styles.testInfoTitle}>Django Backend Test</Text>
            <Text style={styles.testInfoText}>Server: http://10.0.2.2:8000</Text>
            <Text style={styles.testInfoText}>Password Requirements:</Text>
            <Text style={styles.testInfoText}>• At least 6 characters</Text>
            <Text style={styles.testInfoText}>• Mix of letters, numbers & symbols</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: Spacing.large,
    paddingBottom: Spacing.large,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: Spacing.medium,
  },
  title: {
    ...Typography.h1,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.small,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  formContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  form: {
    paddingHorizontal: Spacing.large,
    paddingTop: Spacing.extraLarge,
    paddingBottom: Spacing.extraLarge,
  },
  inputContainer: {
    marginBottom: Spacing.large,
  },
  label: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
    fontWeight: '600',
  },
  input: {
    ...Typography.body,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.medium,
    backgroundColor: Colors.background,
    color: Colors.textPrimary,
  },
  helpText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.small / 2,
    fontSize: 12,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.background,
  },
  passwordInput: {
    ...Typography.body,
    flex: 1,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.medium,
    color: Colors.textPrimary,
  },
  eyeButton: {
    padding: Spacing.medium,
  },
  eyeText: {
    fontSize: 20,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: Spacing.medium,
  },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: Spacing.medium,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  roleButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  roleButtonText: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  roleButtonTextActive: {
    color: Colors.white,
  },
  signupButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.medium,
    alignItems: 'center',
    marginTop: Spacing.medium,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    ...Typography.bodyMedium,
    color: Colors.white,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.extraLarge,
  },
  footerText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  loginLink: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  testInfo: {
    marginTop: Spacing.large,
    padding: Spacing.medium,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  testInfoTitle: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: Spacing.small,
  },
  testInfoText: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
});