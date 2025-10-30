/**
 * Simple Django Connection Test Script
 * 
 * Run this script in Node.js to test Django-TOR communication
 * No React Native imports or complex dependencies
 */

// Simple fetch polyfill for Node.js if needed
const fetch = require('node-fetch');

const API_BASE = 'http://127.0.0.1:8000';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`)
};

// Test 1: Basic Django Server Connection
async function testDjangoConnection() {
  log.info('Testing Django server connection...');
  
  try {
    const response = await fetch(`${API_BASE}/api/v1/public_app/auth/validate_phone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phonenumber: '999999999' })
    });
    
    if (response.ok) {
      log.success('Django server is running and reachable');
      return true;
    } else {
      log.error(`Django server responded with status: ${response.status}`);
      const errorText = await response.text();
      console.log('Error details:', errorText);
      return false;
    }
  } catch (error) {
    log.error(`Failed to connect to Django server: ${error.message}`);
    log.warning('Make sure Django server is running: python manage.py runserver');
    return false;
  }
}

// Test 2: Authentication Flow
async function testAuthentication() {
  log.info('Testing Django authentication...');
  
  try {
    // Step 1: Login to get OTP
    const loginResponse = await fetch(`${API_BASE}/api/v1/public_app/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phonenumber: '712345679',
        password: 'TestPass123!'
      })
    });

    if (!loginResponse.ok) {
      log.error('Login failed');
      return null;
    }

    const loginData = await loginResponse.json();
    log.success(`Login successful, OTP: ${loginData.otp_code}`);

    // Step 2: Complete authentication with OTP
    const authResponse = await fetch(`${API_BASE}/api/v1/public_app/auth/auth_login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phonenumber: '712345679',
        password: 'TestPass123!',
        code: loginData.otp_code
      })
    });

    if (!authResponse.ok) {
      log.error('Authentication with OTP failed');
      return null;
    }

    const authData = await authResponse.json();
    log.success(`Authentication complete, user role: ${authData.user_role}`);
    
    return authData.access; // Return JWT token
  } catch (error) {
    log.error(`Authentication failed: ${error.message}`);
    return null;
  }
}

// Test 3: Protected Endpoint (Get Current User)
async function testProtectedEndpoint(token) {
  if (!token) {
    log.warning('Skipping protected endpoint test (no token)');
    return false;
  }

  log.info('Testing protected endpoint...');
  
  try {
    const response = await fetch(`${API_BASE}/api/v1/public_app/user/get_current_user`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      }
    });

    if (response.ok) {
      const userData = await response.json();
      log.success(`Protected endpoint working! Agent: ${userData.full_names} (Code: ${userData.agent_code})`);
      return true;
    } else {
      log.error(`Protected endpoint failed with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    log.error(`Protected endpoint test failed: ${error.message}`);
    return false;
  }
}

// Test 4: Motor Insurance Form Submission
async function testFormSubmission(token) {
  if (!token) {
    log.warning('Skipping form submission test (no token)');
    return false;
  }

  log.info('Testing motor insurance form submission...');
  
  try {
    const formData = {
      vehicle_make: 'Toyota',
      vehicle_model: 'Test Vehicle',
      vehicle_year: 2020,
      vehicle_registration: 'TEST999',
      cover_type: 'THIRD_PARTY',
      owner_name: 'Test Owner',
      owner_id_number: '99999999',
      owner_phone: '712345679',
      cover_start_date: '2025-09-20',
      cover_end_date: '2026-09-20'
    };

    const response = await fetch(`${API_BASE}/api/v1/public_app/insurance/submit_motor_quotation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      const result = await response.json();
      log.success(`Form submission successful!`);
      log.success(`Quotation Number: ${result.quotation.quotation_number}`);
      log.success(`Quotation ID: ${result.quotation.id}`);
      return true;
    } else {
      const errorText = await response.text();
      log.error(`Form submission failed: ${errorText}`);
      return false;
    }
  } catch (error) {
    log.error(`Form submission test failed: ${error.message}`);
    return false;
  }
}

// Test 5: Premium Calculation
async function testPremiumCalculation(token) {
  if (!token) {
    log.warning('Skipping premium calculation test (no token)');
    return false;
  }

  log.info('Testing premium calculation...');
  
  try {
    const premiumData = {
      vehicle_year: 2020,
      vehicle_make: 'Toyota',
      cover_type: 'THIRD_PARTY'
    };

    const response = await fetch(`${API_BASE}/api/v1/public_app/insurance/calculate_premium`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(premiumData)
    });

    if (response.ok) {
      const result = await response.json();
      log.success(`Premium calculation successful!`);
      log.success(`Base Premium: ${result.base_premium} KES`);
      log.success(`Total Premium: ${result.total_premium} KES`);
      return true;
    } else {
      const errorText = await response.text();
      log.error(`Premium calculation failed: ${errorText}`);
      return false;
    }
  } catch (error) {
    log.error(`Premium calculation test failed: ${error.message}`);
    return false;
  }
}

// Main test function
async function runAllTests() {
  console.log(`${colors.blue}🔍 Django-TOR Communication Test${colors.reset}`);
  console.log(`${colors.blue}=================================${colors.reset}\n`);

  const results = {
    connection: false,
    authentication: false,
    protectedEndpoint: false,
    formSubmission: false,
    premiumCalculation: false
  };

  // Test 1: Basic connection
  results.connection = await testDjangoConnection();
  if (!results.connection) {
    log.error('Cannot proceed with other tests - Django server not reachable');
    return results;
  }

  console.log('');

  // Test 2: Authentication
  const token = await testAuthentication();
  results.authentication = !!token;

  console.log('');

  // Test 3: Protected endpoint
  results.protectedEndpoint = await testProtectedEndpoint(token);

  console.log('');

  // Test 4: Form submission
  results.formSubmission = await testFormSubmission(token);

  console.log('');

  // Test 5: Premium calculation
  results.premiumCalculation = await testPremiumCalculation(token);

  // Summary
  console.log(`\n${colors.blue}📊 Test Summary${colors.reset}`);
  console.log(`${colors.blue}===============${colors.reset}`);
  
  const testNames = [
    'Django Connection',
    'Authentication',
    'Protected Endpoint',
    'Form Submission',
    'Premium Calculation'
  ];

  Object.keys(results).forEach((key, index) => {
    const status = results[key] ? `${colors.green}✅ PASS` : `${colors.red}❌ FAIL`;
    console.log(`${testNames[index]}: ${status}${colors.reset}`);
  });

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n${colors.blue}Result: ${passedTests}/${totalTests} tests passed${colors.reset}`);
  
  if (passedTests === totalTests) {
    log.success('🎉 All tests passed! Django-TOR communication is working perfectly!');
  } else {
    log.warning(`${totalTests - passedTests} test(s) failed. Check Django server and credentials.`);
  }

  return results;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testDjangoConnection,
  testAuthentication,
  testProtectedEndpoint,
  testFormSubmission,
  testPremiumCalculation
};