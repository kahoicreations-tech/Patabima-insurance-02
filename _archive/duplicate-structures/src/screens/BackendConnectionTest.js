// Test Component for Django Backend Connection
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { authAPI } from '../services/api';

export default function BackendConnectionTest() {
  const [phoneNumber, setPhoneNumber] = useState('712345678');
  const [password, setPassword] = useState('TestPass123!');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState([]);

  const addTestResult = (test, success, message, data = null) => {
    const result = {
      test,
      success,
      message,
      data,
      timestamp: new Date().toLocaleTimeString(),
    };
    setTestResults(prev => [result, ...prev]);
  };

  const testSignup = async () => {
    setLoading(true);
    try {
      const result = await authAPI.signup({
        phonenumber: phoneNumber,
        full_names: 'Test User',
        email: 'test@example.com',
        user_role: 'CUSTOMER',
        password: password,
        confirm_password: password,
      });

      addTestResult(
        'Signup Test',
        result.success,
        result.message,
        result.data
      );

      if (result.success) {
        Alert.alert('Success', 'User created successfully! You can now test login.');
      } else {
        Alert.alert('Signup Failed', result.message);
      }
    } catch (error) {
      addTestResult('Signup Test', false, 'Unexpected error', error.message);
    }
    setLoading(false);
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      const result = await authAPI.login({
        phonenumber: phoneNumber,
        password: password,
      });

      addTestResult(
        'Login Step 1 (Get OTP)',
        result.success,
        result.message,
        result.data
      );

      if (result.success && result.otpCode) {
        setOtpCode(result.otpCode);
        Alert.alert('OTP Received', `OTP Code: ${result.otpCode}\nNow test Auth Login`);
      } else {
        Alert.alert('Login Failed', result.message);
      }
    } catch (error) {
      addTestResult('Login Test', false, 'Unexpected error', error.message);
    }
    setLoading(false);
  };

  const testAuthLogin = async () => {
    if (!otpCode) {
      Alert.alert('Error', 'Please get OTP first by testing login');
      return;
    }

    setLoading(true);
    try {
      const result = await authAPI.authLogin({
        phonenumber: phoneNumber,
        password: password,
        code: otpCode,
      });

      addTestResult(
        'Login Step 2 (Verify OTP)',
        result.success,
        result.message,
        result.data
      );

      if (result.success) {
        Alert.alert('Success', 'Login successful! JWT tokens stored.');
      } else {
        Alert.alert('Auth Login Failed', result.message);
      }
    } catch (error) {
      addTestResult('Auth Login Test', false, 'Unexpected error', error.message);
    }
    setLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Django Backend Connection Test</Text>
      <Text style={styles.subtitle}>Server: http://10.0.2.2:8000/api/v1/public_app (Android Emulator)</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Phone Number (9 digits):</Text>
        <TextInput
          style={styles.input}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="712345678"
          keyboardType="numeric"
          maxLength={9}
        />

        <Text style={styles.label}>Password:</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="TestPass123!"
          secureTextEntry
        />

        <Text style={styles.label}>OTP Code:</Text>
        <TextInput
          style={styles.input}
          value={otpCode}
          onChangeText={setOtpCode}
          placeholder="Will be filled automatically"
          keyboardType="numeric"
          maxLength={6}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.signupButton]}
          onPress={testSignup}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Signup</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.loginButton]}
          onPress={testLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Login (Get OTP)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.authButton]}
          onPress={testAuthLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Auth Login (Verify OTP)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearResults}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <ActivityIndicator size="large" color="#D5222B" style={styles.loader} />
      )}

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        {testResults.map((result, index) => (
          <View
            key={index}
            style={[
              styles.resultItem,
              result.success ? styles.successResult : styles.errorResult,
            ]}
          >
            <Text style={styles.resultTest}>{result.test}</Text>
            <Text style={styles.resultTime}>{result.timestamp}</Text>
            <Text style={styles.resultMessage}>{result.message}</Text>
            {result.data && (
              <Text style={styles.resultData}>
                Data: {JSON.stringify(result.data, null, 2)}
              </Text>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D5222B',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#646767',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  signupButton: {
    backgroundColor: '#28a745',
  },
  loginButton: {
    backgroundColor: '#007bff',
  },
  authButton: {
    backgroundColor: '#D5222B',
  },
  clearButton: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loader: {
    marginVertical: 20,
  },
  resultsContainer: {
    marginTop: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  resultItem: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
  },
  successResult: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
  },
  errorResult: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
  },
  resultTest: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  resultTime: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  resultMessage: {
    fontSize: 14,
    marginBottom: 5,
  },
  resultData: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 5,
    fontFamily: 'monospace',
  },
});