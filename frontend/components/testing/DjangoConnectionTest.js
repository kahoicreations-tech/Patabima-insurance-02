/**
 * Django Backend Connection Test Component
 * 
 * This component tests the communication between React Native and Django backend
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import our services
import djangoAPI from '../../services/DjangoAPIService';
import enhancedServices from '../insurance/services/EnhancedServices';

const DjangoConnectionTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [authToken, setAuthToken] = useState(null);

  const addResult = (testName, status, message, data = null) => {
    const result = {
      testName,
      status, // 'success', 'error', 'info'
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [...prev, result]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // Test 1: Basic Django Server Connection
  const testDjangoConnection = async () => {
    try {
      addResult('Django Connection', 'info', 'Testing basic Django server connection...');
      
      const response = await fetch('http://127.0.0.1:8000/api/v1/public_app/auth/validate_phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phonenumber: '999999999' })
      });

      if (response.ok) {
        addResult('Django Connection', 'success', 'Django server is reachable and responding');
        return true;
      } else {
        addResult('Django Connection', 'error', `Django server responded with status: ${response.status}`);
        return false;
      }
    } catch (error) {
      addResult('Django Connection', 'error', `Failed to connect to Django: ${error.message}`);
      return false;
    }
  };

  // Test 2: Authentication Flow
  const testAuthentication = async () => {
    try {
      addResult('Authentication', 'info', 'Testing Django authentication flow...');

      // Test phone validation first
      const phoneValidation = await djangoAPI.validatePhone('712345679');
      addResult('Phone Validation', 'success', 'Phone validation working');

      // Test login (get OTP)
      const loginResponse = await djangoAPI.login('712345679', 'TestPass123!');
      addResult('Login OTP', 'success', `OTP received: ${loginResponse.otpCode}`);

      // Test complete authentication
      const authResponse = await djangoAPI.authenticateWithOTP('712345679', 'TestPass123!', loginResponse.otpCode);
      setAuthToken(authResponse.userRole);
      addResult('Authentication', 'success', `Authenticated as: ${authResponse.userRole}`);

      return true;
    } catch (error) {
      addResult('Authentication', 'error', `Authentication failed: ${error.message}`);
      return false;
    }
  };

  // Test 3: Enhanced Services Integration
  const testEnhancedServices = async () => {
    try {
      addResult('Enhanced Services', 'info', 'Testing Enhanced Services integration...');

      // Initialize services
      await enhancedServices.initializeServices();
      
      // Test premium calculation
      const premiumResult = await enhancedServices.UnderwriterService.calculatePremium({
        vehicle_make: 'Toyota',
        vehicle_model: 'Hilux',
        vehicle_year: 2020,
        cover_type: 'THIRD_PARTY'
      });

      if (premiumResult.success) {
        addResult('Premium Calculation', 'success', 
          `Premium calculated: ${premiumResult.data.totalPremium} KES (${premiumResult.source})`);
      }

      // Test underwriters
      const underwritersResult = await enhancedServices.UnderwriterService.getUnderwriters('motor');
      if (underwritersResult.success) {
        addResult('Underwriters', 'success', 
          `${underwritersResult.underwriters.length} underwriters available (${underwritersResult.source})`);
      }

      return true;
    } catch (error) {
      addResult('Enhanced Services', 'error', `Enhanced Services failed: ${error.message}`);
      return false;
    }
  };

  // Test 4: Form Submission
  const testFormSubmission = async () => {
    try {
      addResult('Form Submission', 'info', 'Testing motor insurance form submission...');

      const testFormData = {
        vehicle_make: 'Toyota',
        vehicle_model: 'Hilux',
        vehicle_year: 2020,
        vehicle_registration: 'KCA999T',
        cover_type: 'THIRD_PARTY',
        owner_name: 'Test User',
        owner_id_number: '99999999',
        owner_phone: '712345679',
        owner_email: 'test@example.com',
        cover_start_date: '2025-09-20',
        cover_end_date: '2026-09-20'
      };

      const submissionResult = await enhancedServices.submitMotorInsuranceForm(testFormData);
      
      if (submissionResult.success) {
        addResult('Form Submission', 'success', 
          `Form submitted successfully! Quotation: ${submissionResult.quotationNumber || submissionResult.quotationId} (${submissionResult.source})`);
      }

      return true;
    } catch (error) {
      addResult('Form Submission', 'error', `Form submission failed: ${error.message}`);
      return false;
    }
  };

  // Test 5: Protected Endpoints
  const testProtectedEndpoints = async () => {
    try {
      addResult('Protected Endpoints', 'info', 'Testing protected Django endpoints...');

      // Test get current user
      const userResponse = await djangoAPI.getCurrentUser();
      addResult('Current User', 'success', `Retrieved user profile: ${userResponse.full_names}`);

      // Test get quotations
      const quotationsResponse = await djangoAPI.getQuotations();
      addResult('Quotations', 'success', `Retrieved ${quotationsResponse.count || 0} quotations`);

      return true;
    } catch (error) {
      addResult('Protected Endpoints', 'error', `Protected endpoints failed: ${error.message}`);
      return false;
    }
  };

  // Run All Tests
  const runAllTests = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    clearResults();
    
    addResult('Test Suite', 'info', 'Starting comprehensive Django-TOR communication tests...');

    try {
      // Run tests sequentially
      const connectionOk = await testDjangoConnection();
      if (!connectionOk) {
        addResult('Test Suite', 'error', 'Django connection failed - stopping tests');
        return;
      }

      const authOk = await testAuthentication();
      if (!authOk) {
        addResult('Test Suite', 'error', 'Authentication failed - stopping tests');
        return;
      }

      await testEnhancedServices();
      await testFormSubmission();
      await testProtectedEndpoints();

      addResult('Test Suite', 'success', 'All tests completed! Django-TOR communication is working.');
      
    } catch (error) {
      addResult('Test Suite', 'error', `Test suite failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Test Individual Components
  const testIndividual = async (testFunction, testName) => {
    if (isRunning) return;
    
    setIsRunning(true);
    addResult(testName, 'info', `Running ${testName} test...`);
    
    try {
      await testFunction();
    } catch (error) {
      addResult(testName, 'error', `${testName} test failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      case 'info': return '#2196F3';
      default: return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return '•';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Django-TOR Communication Test</Text>
      <Text style={styles.subtitle}>Test the integration between React Native and Django Backend</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={runAllTests}
          disabled={isRunning}
        >
          {isRunning ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Run All Tests</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={clearResults}
          disabled={isRunning}
        >
          <Text style={styles.buttonTextSecondary}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.individualTests}>
        <Text style={styles.sectionTitle}>Individual Tests:</Text>
        <View style={styles.testButtons}>
          <TouchableOpacity
            style={styles.testButton}
            onPress={() => testIndividual(testDjangoConnection, 'Connection')}
            disabled={isRunning}
          >
            <Text style={styles.testButtonText}>Connection</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.testButton}
            onPress={() => testIndividual(testAuthentication, 'Auth')}
            disabled={isRunning}
          >
            <Text style={styles.testButtonText}>Auth</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.testButton}
            onPress={() => testIndividual(testFormSubmission, 'Form')}
            disabled={isRunning}
          >
            <Text style={styles.testButtonText}>Form</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        {testResults.map((result, index) => (
          <View key={index} style={styles.resultItem}>
            <View style={styles.resultHeader}>
              <Text style={[styles.resultStatus, { color: getStatusColor(result.status) }]}>
                {getStatusIcon(result.status)} {result.testName}
              </Text>
              <Text style={styles.resultTime}>{result.timestamp}</Text>
            </View>
            <Text style={styles.resultMessage}>{result.message}</Text>
            {result.data && (
              <Text style={styles.resultData}>{JSON.stringify(result.data, null, 2)}</Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  primaryButton: {
    backgroundColor: '#D5222B',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D5222B',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonTextSecondary: {
    color: '#D5222B',
    fontWeight: 'bold',
    fontSize: 16,
  },
  individualTests: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  testButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  testButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  resultItem: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  resultStatus: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultTime: {
    fontSize: 12,
    color: '#666',
  },
  resultMessage: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  resultData: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
    marginTop: 5,
    fontFamily: 'monospace',
  },
});

export default DjangoConnectionTest;