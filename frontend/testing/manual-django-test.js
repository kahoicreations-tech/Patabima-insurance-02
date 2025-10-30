/**
 * Manual Django Communication Test
 * 
 * Quick script to test Django endpoints from terminal/console
 */

const API_BASE = 'http://127.0.0.1:8000';

// Test functions
const testEndpoints = async () => {
  console.log('🔍 Testing Django-TOR Communication...\n');

  // Test 1: Basic server connection
  console.log('1️⃣ Testing Django server connection...');
  try {
    const response = await fetch(`${API_BASE}/api/v1/public_app/auth/validate_phone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phonenumber: '999999999' })
    });
    
    if (response.ok) {
      console.log('✅ Django server is reachable and responding');
    } else {
      console.log(`❌ Django server responded with status: ${response.status}`);
      const error = await response.text();
      console.log('Error details:', error);
    }
  } catch (error) {
    console.log('❌ Failed to connect to Django:', error.message);
    return false;
  }

  // Test 2: Authentication flow
  console.log('\n2️⃣ Testing authentication flow...');
  try {
    // Get OTP
    const loginResponse = await fetch(`${API_BASE}/api/v1/public_app/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phonenumber: '712345679',
        password: 'TestPass123!'
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful, OTP received:', loginData.otp_code);
      
      // Complete authentication
      const authResponse = await fetch(`${API_BASE}/api/v1/public_app/auth/auth_login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phonenumber: '712345679',
          password: 'TestPass123!',
          code: loginData.otp_code
        })
      });

      if (authResponse.ok) {
        const authData = await authResponse.json();
        console.log('✅ Authentication complete, role:', authData.user_role);
        
        // Test protected endpoint
        const userResponse = await fetch(`${API_BASE}/api/v1/public_app/user/get_current_user`, {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${authData.access}`,
            'Content-Type': 'application/json' 
          }
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          console.log('✅ Protected endpoint working, agent:', userData.full_names, '- Code:', userData.agent_code);
        }

        return authData.access; // Return token for further tests
      }
    }
  } catch (error) {
    console.log('❌ Authentication failed:', error.message);
  }

  return null;
};

// Test 3: Insurance form submission
const testFormSubmission = async (token) => {
  if (!token) {
    console.log('\n3️⃣ Skipping form submission test (no auth token)');
    return;
  }

  console.log('\n3️⃣ Testing form submission...');
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
      console.log('✅ Form submission successful!');
      console.log('   Quotation Number:', result.quotation.quotation_number);
      console.log('   Quotation ID:', result.quotation.id);
    } else {
      const error = await response.text();
      console.log('❌ Form submission failed:', error);
    }
  } catch (error) {
    console.log('❌ Form submission error:', error.message);
  }
};

// Test 4: Premium calculation
const testPremiumCalculation = async (token) => {
  if (!token) {
    console.log('\n4️⃣ Skipping premium calculation test (no auth token)');
    return;
  }

  console.log('\n4️⃣ Testing premium calculation...');
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
      console.log('✅ Premium calculation successful!');
      console.log('   Base Premium:', result.base_premium, 'KES');
      console.log('   Total Premium:', result.total_premium, 'KES');
    } else {
      const error = await response.text();
      console.log('❌ Premium calculation failed:', error);
    }
  } catch (error) {
    console.log('❌ Premium calculation error:', error.message);
  }
};

// Run all tests
const runAllTests = async () => {
  const token = await testEndpoints();
  await testFormSubmission(token);
  await testPremiumCalculation(token);
  
  console.log('\n🎉 Django-TOR communication test completed!');
  console.log('\nTo use this test:');
  console.log('1. Ensure Django server is running on http://127.0.0.1:8000');
  console.log('2. Run this script in a browser console or Node.js environment');
  console.log('3. Check the console output for test results');
};

// Export for use in browser console or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests, testEndpoints, testFormSubmission, testPremiumCalculation };
} else {
  // Browser environment - run automatically
  runAllTests();
}

// Instructions for manual testing:
console.log(`
📋 MANUAL TESTING INSTRUCTIONS:

1. Start Django server:
   cd "C:\\Users\\USER\\Desktop\\PATABIMA\\PATABIMA FRONT\\PATA BIMA AGENCY - Copy\\insurance-app"
   python manage.py runserver

2. Test basic connection:
   curl -X POST http://127.0.0.1:8000/api/v1/public_app/auth/validate_phone -H "Content-Type: application/json" -d "{\\"phonenumber\\": \\"999999999\\"}"

3. Test authentication:
   curl -X POST http://127.0.0.1:8000/api/v1/public_app/auth/login -H "Content-Type: application/json" -d "{\\"phonenumber\\": \\"712345679\\", \\"password\\": \\"TestPass123!\\"}"

4. Run the React Native app and look for the blue test button on the home screen (development mode only)

5. Navigate to the Django Test screen to run comprehensive tests
`);