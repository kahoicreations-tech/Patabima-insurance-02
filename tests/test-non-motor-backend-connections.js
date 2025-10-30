/**
 * Non-Motor Insurance Backend Connection Test Script
 * Tests all 7 non-motor insurance products to verify they're properly wired to the backend
 * 
 * Run: node tests/test-non-motor-backend-connections.js
 * 
 * Requirements:
 * - Django backend running on localhost:8000 or configured API_BASE_URL
 * - Valid authentication token (or test with public endpoints)
 */

const https = require('https');
const http = require('http');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';
const AUTH_TOKEN = process.env.AUTH_TOKEN || null; // Optional: Set valid JWT token for authenticated testing

// Test data for each insurance product
const TEST_CASES = [
  {
    name: 'Medical Insurance (Individual)',
    lineKey: 'MEDICAL',
    endpoint: '/api/v1/public_app/manual_quotes',
    payload: {
      line_key: 'MEDICAL',
      payload: {
        inpatientLimit: '1m',
        outpatientCover: true,
        maternityCover: false,
        age: '35',
        spouseAge: '32',
        numberOfChildren: '2',
        preferredUnderwriters: ['UW_001', 'UW_002'],
        fullName: 'Test Client Medical',
        idNumber: '12345678',
        phoneNumber: '0712345678',
        emailAddress: 'test.medical@example.com',
        declaration: true
      },
      preferred_underwriters: ['UW_001', 'UW_002'],
      notes: '',
      app_version: '1.0.0'
    }
  },
  {
    name: 'WIBA Insurance',
    lineKey: 'WIBA',
    endpoint: '/api/v1/public_app/manual_quotes',
    payload: {
      line_key: 'WIBA',
      payload: {
        company_name: 'Test WIBA Company Ltd',
        nature_of_business: 'Manufacturing',
        number_of_employees: 50,
        average_monthly_salary: 50000,
        industry: 'Manufacturing',
        industry_multiplier: 1.5,
        departments: [
          { name: 'Production', employees: 30, annual_salary: 18000000 },
          { name: 'Administration', employees: 20, annual_salary: 12000000 }
        ],
        preferred_underwriters: ['UW_001']
      },
      preferred_underwriters: ['UW_001'],
      notes: '',
      app_version: '1.0.0'
    }
  },
  {
    name: 'Travel Insurance',
    lineKey: 'TRAVEL',
    endpoint: '/api/v1/public_app/manual_quotes',
    payload: {
      line_key: 'TRAVEL',
      payload: {
        client_name: 'Test Travel Client',
        travelers_age: 28,
        destination: 'Dubai, UAE',
        purpose_of_travel: 'tourism',
        departure_date: '2025-12-01',
        return_date: '2025-12-15',
        preferred_underwriters: ['UW_001', 'UW_002']
      },
      preferred_underwriters: ['UW_001', 'UW_002'],
      notes: '',
      app_version: '1.0.0'
    }
  },
  {
    name: 'Personal Accident Insurance',
    lineKey: 'PERSONAL_ACCIDENT',
    endpoint: '/api/v1/public_app/manual_quotes',
    payload: {
      line_key: 'PERSONAL_ACCIDENT',
      payload: {
        age: 40,
        client_type: 'individual',
        cover_limit_id: '1m',
        cover_limit_value: 1000000,
        preferred_underwriters: ['UW_001']
      },
      preferred_underwriters: ['UW_001'],
      notes: '',
      app_version: '1.0.0'
    }
  },
  {
    name: 'Professional Indemnity Insurance',
    lineKey: 'PROFESSIONAL_INDEMNITY',
    endpoint: '/api/v1/public_app/manual_quotes',
    payload: {
      line_key: 'PROFESSIONAL_INDEMNITY',
      payload: {
        business_name: 'Test Professional Services Ltd',
        business_registration_number: 'PVT-123456',
        business_type: 'Limited Company',
        principal_contact_name: 'Test Professional',
        phone_number: '0712345678',
        email_address: 'test.prof@example.com',
        physical_address: 'Nairobi, Kenya',
        profession: 'Accountant/Auditor',
        profession_multiplier: 1.2,
        years_in_business: 5,
        number_of_employees: 10,
        annual_turnover: 5000000,
        professional_qualifications: 'CPA(K)',
        professional_bodies: 'ICPAK',
        indemnity_limit: 5000000,
        indemnity_limit_base_premium: 150000,
        excess_amount: 50000,
        excess_multiplier: 0.9,
        territory_of_coverage: 'Kenya',
        include_cyber_liability: false,
        include_employment_practices: false,
        include_directors_officers: false,
        preferred_underwriters: ['UW_001']
      },
      preferred_underwriters: ['UW_001'],
      notes: '',
      app_version: '1.0.0'
    }
  },
  {
    name: 'Last Expense Insurance',
    lineKey: 'LAST_EXPENSE',
    endpoint: '/api/v1/public_app/manual_quotes',
    payload: {
      line_key: 'LAST_EXPENSE',
      payload: {
        // Coverage Details
        age: 55,
        cover_limit_id: '200k',
        cover_limit_value: 200000,
        number_of_dependents: 3,
        
        // Client Details
        full_name: 'John Mwangi Kamau',
        id_number: '12345678',
        phone_number: '0712345678',
        email_address: 'john.kamau@example.com',
        
        // Preferences
        preferred_underwriters: ['UW_001']
      },
      preferred_underwriters: ['UW_001'],
      notes: '',
      app_version: '1.0.0'
    }
  },
  {
    name: 'Domestic Package Insurance',
    lineKey: 'DOMESTIC_PACKAGE',
    endpoint: '/api/v1/public_app/manual_quotes',
    payload: {
      line_key: 'DOMESTIC_PACKAGE',
      payload: {
        owner_name: 'Test Homeowner',
        id_number: '12345678',
        phone_number: '0712345678',
        email_address: 'test.home@example.com',
        property_address: 'Westlands, Nairobi',
        property_type: 'Apartment/Flat',
        property_type_multiplier: 1.0,
        building_material: 'Concrete/Stone',
        building_material_multiplier: 1.0,
        occupancy_type: 'Owner Occupied',
        year_built: 2015,
        number_of_rooms: 3,
        has_security_system: true,
        building_value: 5000000,
        contents_value: 1000000,
        include_personal_accident: true,
        include_public_liability: true,
        include_all_risks: false,
        include_loss_of_rent: false,
        preferred_underwriters: ['UW_001']
      },
      preferred_underwriters: ['UW_001'],
      notes: '',
      app_version: '1.0.0'
    }
  }
];

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test results tracking
const results = {
  passed: [],
  failed: [],
  skipped: []
};

/**
 * Make HTTP request to test endpoint
 */
function makeRequest(url, options, postData) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    // Set timeout
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

/**
 * Test single insurance product
 */
async function testProduct(testCase) {
  const url = `${API_BASE_URL}${testCase.endpoint}`;
  const postData = JSON.stringify(testCase.payload);
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  // Add auth token if available
  if (AUTH_TOKEN) {
    options.headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }
  
  console.log(`\n${colors.cyan}Testing: ${colors.bright}${testCase.name}${colors.reset}`);
  console.log(`${colors.blue}Line Key: ${testCase.lineKey}${colors.reset}`);
  console.log(`${colors.blue}Endpoint: ${testCase.endpoint}${colors.reset}`);
  
  try {
    const response = await makeRequest(url, options, postData);
    
    // Check response status
    if (response.statusCode === 200 || response.statusCode === 201) {
      // Check if response has success flag or reference
      if (response.data.success || response.data.reference || response.data.quote_reference) {
        console.log(`${colors.green}✓ PASSED${colors.reset}`);
        console.log(`  Status: ${response.statusCode}`);
        console.log(`  Reference: ${response.data.reference || response.data.quote_reference || 'N/A'}`);
        
        results.passed.push({
          name: testCase.name,
          lineKey: testCase.lineKey,
          reference: response.data.reference || response.data.quote_reference
        });
        return true;
      } else {
        console.log(`${colors.yellow}⚠ WARNING${colors.reset}`);
        console.log(`  Status: ${response.statusCode}`);
        console.log(`  Message: Success but no reference returned`);
        console.log(`  Response:`, JSON.stringify(response.data, null, 2));
        
        results.failed.push({
          name: testCase.name,
          lineKey: testCase.lineKey,
          error: 'No reference in response',
          response: response.data
        });
        return false;
      }
    } else if (response.statusCode === 401 || response.statusCode === 403) {
      console.log(`${colors.yellow}⊘ SKIPPED (Authentication Required)${colors.reset}`);
      console.log(`  Status: ${response.statusCode}`);
      console.log(`  Hint: Set AUTH_TOKEN environment variable with valid JWT token`);
      
      results.skipped.push({
        name: testCase.name,
        lineKey: testCase.lineKey,
        reason: 'Authentication required'
      });
      return null;
    } else {
      console.log(`${colors.red}✗ FAILED${colors.reset}`);
      console.log(`  Status: ${response.statusCode}`);
      console.log(`  Error:`, response.data.message || response.data.detail || JSON.stringify(response.data));
      
      results.failed.push({
        name: testCase.name,
        lineKey: testCase.lineKey,
        error: response.data.message || response.data.detail || 'Unknown error',
        statusCode: response.statusCode
      });
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ FAILED${colors.reset}`);
    console.log(`  Error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log(`  ${colors.yellow}Hint: Make sure Django backend is running on ${API_BASE_URL}${colors.reset}`);
    }
    
    results.failed.push({
      name: testCase.name,
      lineKey: testCase.lineKey,
      error: error.message
    });
    return false;
  }
}

/**
 * Print summary report
 */
function printSummary() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${colors.bright}TEST SUMMARY${colors.reset}`);
  console.log(`${'='.repeat(60)}\n`);
  
  const total = TEST_CASES.length;
  const passed = results.passed.length;
  const failed = results.failed.length;
  const skipped = results.skipped.length;
  
  console.log(`Total Tests:    ${total}`);
  console.log(`${colors.green}Passed:${colors.reset}         ${passed}`);
  console.log(`${colors.red}Failed:${colors.reset}         ${failed}`);
  console.log(`${colors.yellow}Skipped:${colors.reset}        ${skipped}`);
  
  // Passed tests
  if (results.passed.length > 0) {
    console.log(`\n${colors.green}${colors.bright}PASSED TESTS:${colors.reset}`);
    results.passed.forEach((test, index) => {
      console.log(`  ${index + 1}. ${test.name} (${test.lineKey})`);
      if (test.reference) {
        console.log(`     Reference: ${test.reference}`);
      }
    });
  }
  
  // Failed tests
  if (results.failed.length > 0) {
    console.log(`\n${colors.red}${colors.bright}FAILED TESTS:${colors.reset}`);
    results.failed.forEach((test, index) => {
      console.log(`  ${index + 1}. ${test.name} (${test.lineKey})`);
      console.log(`     Error: ${test.error}`);
    });
  }
  
  // Skipped tests
  if (results.skipped.length > 0) {
    console.log(`\n${colors.yellow}${colors.bright}SKIPPED TESTS:${colors.reset}`);
    results.skipped.forEach((test, index) => {
      console.log(`  ${index + 1}. ${test.name} (${test.lineKey})`);
      console.log(`     Reason: ${test.reason}`);
    });
  }
  
  console.log(`\n${'='.repeat(60)}\n`);
  
  // Overall status
  if (failed === 0 && skipped === 0) {
    console.log(`${colors.green}${colors.bright}ALL TESTS PASSED! ✓${colors.reset}\n`);
    process.exit(0);
  } else if (failed === 0 && skipped > 0) {
    console.log(`${colors.yellow}${colors.bright}TESTS COMPLETED WITH SKIPS${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}${colors.bright}SOME TESTS FAILED ✗${colors.reset}\n`);
    process.exit(1);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(`${colors.bright}${colors.cyan}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`  NON-MOTOR INSURANCE BACKEND CONNECTION TESTS`);
  console.log(`${'='.repeat(60)}`);
  console.log(`${colors.reset}\n`);
  
  console.log(`${colors.blue}Configuration:${colors.reset}`);
  console.log(`  API Base URL: ${API_BASE_URL}`);
  console.log(`  Auth Token:   ${AUTH_TOKEN ? 'Provided ✓' : 'Not provided (testing as public)'}`);
  console.log(`  Total Tests:  ${TEST_CASES.length}`);
  
  // Run all tests sequentially
  for (const testCase of TEST_CASES) {
    await testProduct(testCase);
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Print summary
  printSummary();
}

// Run tests
runTests().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
