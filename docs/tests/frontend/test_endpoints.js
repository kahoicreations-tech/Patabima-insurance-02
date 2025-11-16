// Test script to verify insurance-app endpoints are working
const { default: fetch } = require('node-fetch');

const BASE = 'http://127.0.0.1:8000';

async function testEndpoint(url, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url.startsWith('http') ? url : `${BASE}${url}`, options);
    const result = await response.json();

    console.log(`✅ ${method} ${url}: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(result, null, 2));
    return { success: true, data: result, status: response.status };
  } catch (error) {
    console.log(`❌ ${method} ${url}: ERROR`);
    console.log(`   Error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Testing Insurance App Endpoints...\n');

  // Test public endpoints (no auth required)
  console.log('📋 Testing Configuration Endpoints:');
  await testEndpoint('/api/v1/public_app/config/cover_options');
  await testEndpoint('/api/v1/public_app/config/underwriters');
  
  console.log('\n🚗 Testing Motor Categories, Subcategories and Cover Types:');
  await testEndpoint('/api/v1/motor/categories/');
  await testEndpoint('/api/v1/motor/subcategories/?category=PRIVATE');
  await testEndpoint('/api/v1/motor/cover-types/?category=PRIVATE');
  await testEndpoint('/api/v1/motor/cover-types/?category=COMMERCIAL');

  console.log('\n💰 Testing Premium Calculation:');
  await testEndpoint('/api/v1/public_app/insurance/calculate_motor_premium', 'POST', {
    vehicle_year: 2020,
    cover_type: 'THIRD_PARTY',
    vehicle_make: 'Toyota',
    category: 'PRIVATE',
    subcategory_code: 'PRIVATE_THIRD_PARTY'
  });

  console.log('\n🔐 Testing Authentication Endpoints:');
  await testEndpoint('/api/v1/public_app/auth/validate_phone', 'POST', {
    phonenumber: '712345678'
  });

  console.log('\n🏥 Testing Integration Endpoints:');
  // Note: These require authentication, will show 401 responses
  await testEndpoint('/api/v1/public_app/integrations/vehicle_check', 'POST', {
    vehicle_registration: 'KCA234Z',
    vehicle_make: 'Toyota',
    vehicle_model: 'Corolla',
    vehicle_year: 2020
  });

  console.log('\n📄 Testing Document Endpoints:');
  await testEndpoint('/api/v1/public_app/documents/upload', 'POST', {
    document_type: 'VEHICLE_REGISTRATION',
    owner_name: 'John Doe',
    vehicle_registration: 'KCA234Z'
  });

  console.log('\n💳 Testing Payment Endpoints:');
  await testEndpoint('/api/v1/public_app/payments/initiate', 'POST', {
    amount: 5000,
    method: 'MPESA'
  });

  console.log('\n📋 Testing Policy Endpoints:');
  await testEndpoint('/api/v1/public_app/policies/issue', 'POST', {
    quotation_id: 'test-123'
  });

  console.log('\n✅ Endpoint testing completed!');
}

runTests().catch(console.error);