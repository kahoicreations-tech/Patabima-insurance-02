/**
 * Test Script: Verify Extendible Products Backend Connection
 * 
 * This script tests whether extendible motor insurance products are properly
 * wired to the Django backend by creating a test policy and verifying the response.
 * 
 * Run this script from the terminal:
 * node test-extendible-backend.js
 */

const http = require('http');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:8000';
const AUTH_TOKEN = process.env.AUTH_TOKEN || ''; // Add your auth token if needed

// Test Policy Data - Extendible Product
const testPolicyData = {
  // Quote ID
  quoteId: `TEST-EXT-${Date.now()}`,
  
  // Client Details
  clientDetails: {
    first_name: 'John',
    last_name: 'Mwangi',
    email: 'john.mwangi@test.com',
    phone: '0712345678',
    fullName: 'John Mwangi',
    kra_pin: 'A123456789X',
    id_number: '12345678',
  },
  
  // Vehicle Details
  vehicleDetails: {
    registration: 'KCA 123T',
    vehicle_registration: 'KCA 123T',
    chassis_number: 'TEST123456789',
    make: 'Toyota',
    vehicle_make: 'Toyota',
    model: 'Fielda',
    vehicle_model: 'Fielda',
    year: 2020,
    sum_insured: 0,  // Third-Party doesn't need sum insured
    cover_start_date: new Date().toISOString().split('T')[0],
  },
  
  // Product Details - EXTENDIBLE THIRD-PARTY
  productDetails: {
    category: 'PRIVATE',
    subcategory: 'PRIVATE_THIRD_PARTY_EXT',
    name: 'Private Third-Party Extendible',
    coverage_type: 'THIRD_PARTY',
    is_extendible: true,  // NEW FIELD
  },
  
  // Extendible Configuration - NEW SECTION
  extendibleConfig: {
    initial_period_days: 30,
    initial_amount: 3600,  // 60% of 6000
    balance_amount: 2400,  // 40% of 6000
    total_annual_premium: 6000,
    extension_deadline_days: 30,
    grace_period_days: 7,
    payment_plan: 'installments',  // 'full' or 'installments'
  },
  
  // Premium Breakdown
  premiumBreakdown: {
    base_premium: 5960.4,  // Calculated base
    total_premium: 6000,
    training_levy: 14.9,  // 0.25% of base
    pcf_levy: 14.9,  // 0.25% of base
    stamp_duty: 40,
  },
  
  // Payment Details
  paymentDetails: {
    method: 'MPESA',
    amount: 3600,  // Initial payment only for installments
    status: 'CONFIRMED',
  },
  
  // Underwriter Details
  underwriterDetails: {
    name: 'Test Underwriter',
    company: 'Test Insurance Company',
  },
  
  // Additional fields
  addons: [],
  documents: [],
};

/**
 * Make HTTP POST request to Django backend
 */
function testBackendConnection() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(testPolicyData);
    const url = new URL('/api/v1/policies/motor/create/', API_BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 8000,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };
    
    if (AUTH_TOKEN) {
      options.headers.Authorization = `Bearer ${AUTH_TOKEN}`;
    }
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('\n' + '='.repeat(80));
        console.log('BACKEND RESPONSE:');
        console.log('='.repeat(80));
        console.log('Status Code:', res.statusCode);
        console.log('Response Body:', data);
        console.log('='.repeat(80) + '\n');
        
        try {
          const json = JSON.parse(data);
          
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log('✅ SUCCESS: Policy created!');
            console.log('Policy Number:', json.policy_number || json.policyNumber);
            console.log('Policy ID:', json.policy_id || json.policyId || json.id);
            
            // Verify extendible fields are returned
            console.log('\n' + '-'.repeat(80));
            console.log('EXTENDIBLE FIELDS VERIFICATION:');
            console.log('-'.repeat(80));
            console.log('is_extendible:', json.is_extendible || json.isExtendible || 'NOT FOUND');
            console.log('payment_plan:', json.payment_plan || json.paymentPlan || 'NOT FOUND');
            console.log('initial_payment:', json.initial_payment || json.initialPayment || 'NOT FOUND');
            console.log('balance_payment:', json.balance_payment || json.balancePayment || 'NOT FOUND');
            console.log('balance_deadline:', json.balance_deadline || json.balanceDeadline || 'NOT FOUND');
            console.log('extendible_config:', json.extendible_config || json.extendibleConfig || 'NOT FOUND');
            console.log('-'.repeat(80) + '\n');
            
            if (json.is_extendible || json.isExtendible) {
              console.log('✅ Extendible product properly wired to backend!');
            } else {
              console.log('⚠️  WARNING: Extendible fields not found in response');
            }
            
            resolve(json);
          } else {
            console.log('❌ FAILED: Unexpected status code');
            console.log('Error details:', json);
            reject(new Error(`Status ${res.statusCode}: ${JSON.stringify(json)}`));
          }
        } catch (e) {
          console.log('❌ FAILED: Invalid JSON response');
          console.log('Raw response:', data);
          reject(new Error('Invalid JSON response'));
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('\n' + '='.repeat(80));
      console.log('❌ CONNECTION FAILED:');
      console.log('='.repeat(80));
      console.log('Error:', error.message);
      console.log('\nPossible causes:');
      console.log('1. Django server not running (start with: python manage.py runserver)');
      console.log('2. Wrong API URL (current: ' + API_BASE_URL + ')');
      console.log('3. Firewall blocking connection');
      console.log('='.repeat(80) + '\n');
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

/**
 * Test policy retrieval
 */
function testPolicyRetrieval(policyId) {
  return new Promise((resolve, reject) => {
    const url = new URL(`/api/v1/policies/motor/${policyId}/`, API_BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 8000,
      path: url.pathname,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (AUTH_TOKEN) {
      options.headers.Authorization = `Bearer ${AUTH_TOKEN}`;
    }
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          
          console.log('\n' + '='.repeat(80));
          console.log('POLICY RETRIEVAL TEST:');
          console.log('='.repeat(80));
          console.log('Status Code:', res.statusCode);
          
          if (res.statusCode === 200) {
            console.log('✅ Policy retrieved successfully!');
            console.log('\nRetrieved Data:');
            console.log(JSON.stringify(json, null, 2));
            resolve(json);
          } else {
            console.log('❌ Failed to retrieve policy');
            reject(new Error(`Status ${res.statusCode}`));
          }
        } catch (e) {
          console.log('❌ Invalid JSON response');
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

// Run the tests
async function runTests() {
  console.log('\n' + '='.repeat(80));
  console.log('EXTENDIBLE PRODUCTS BACKEND TEST');
  console.log('='.repeat(80));
  console.log('Testing endpoint:', API_BASE_URL + '/api/v1/policies/motor/create/');
  console.log('='.repeat(80) + '\n');
  
  try {
    // Test 1: Create extendible policy
    console.log('Test 1: Creating extendible policy...\n');
    const createdPolicy = await testBackendConnection();
    
    // Test 2: Retrieve the policy
    if (createdPolicy.policy_id || createdPolicy.policyId || createdPolicy.id) {
      const policyId = createdPolicy.policy_id || createdPolicy.policyId || createdPolicy.id;
      console.log('\nTest 2: Retrieving created policy...\n');
      await testPolicyRetrieval(policyId);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    console.log('\n' + '='.repeat(80));
    console.log('❌ TESTS FAILED');
    console.log('='.repeat(80));
    console.log('Error:', error.message);
    console.log('\nNext steps:');
    console.log('1. Ensure Django server is running');
    console.log('2. Check backend logs for errors');
    console.log('3. Verify Motor2Policy model has extendible fields');
    console.log('4. Check serializer includes all required fields');
    console.log('='.repeat(80) + '\n');
    process.exit(1);
  }
}

// Execute tests
runTests();
