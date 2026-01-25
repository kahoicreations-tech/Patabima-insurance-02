/**
 * DMVIC Integration Diagnostic Tool
 * Run this to test if DMVIC check is working properly
 * 
 * Usage:
 * 1. Open React Native Debugger
 * 2. Paste this into console or run as a test script
 * 3. Check console logs for diagnostic results
 */

// Test 1: Check if DMVIC endpoint is accessible
async function testDMVICEndpoint() {
  console.log('\n========================================');
  console.log('TEST 1: DMVIC Endpoint Accessibility');
  console.log('========================================\n');
  
  try {
    const baseURL = 'http://127.0.0.1:8000'; // Change to your backend URL
    const endpoint = '/api/insurance/dmvic/search-vehicle/';
    
    const payload = {
      registration_number: 'KAA123A',
      proposed_cover_start_date: new Date().toISOString().split('T')[0],
    };
    
    console.log('📤 Request URL:', baseURL + endpoint);
    console.log('📤 Request Payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(baseURL + endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add Authorization header if needed
        // 'Authorization': `Bearer ${yourToken}`,
      },
      body: JSON.stringify(payload),
    });
    
    console.log('📥 Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Response Data:', JSON.stringify(data, null, 2));
      console.log('\n✅ DMVIC endpoint is accessible and responding correctly');
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ Response Error:', errorText);
      console.error('\n❌ DMVIC endpoint returned error status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
    console.error('\n❌ Cannot reach DMVIC endpoint. Check:');
    console.error('  - Backend server is running (python manage.py runserver)');
    console.error('  - Correct URL in DjangoAPIService.js');
    console.error('  - Firewall/network settings');
    return false;
  }
}

// Test 2: Verify Kenyan plate format validation
function testPlateValidation() {
  console.log('\n========================================');
  console.log('TEST 2: Kenyan Plate Format Validation');
  console.log('========================================\n');
  
  const kenyanPlatePattern = /^K[A-Z]{2}\s*\d{3}[A-Z]$/i;
  
  const testCases = [
    { input: 'KAA 123A', expected: true, description: 'Valid with space' },
    { input: 'KAA123A', expected: true, description: 'Valid without space' },
    { input: 'kaa 123a', expected: true, description: 'Valid lowercase' },
    { input: 'KBZ 456C', expected: true, description: 'Valid different series' },
    { input: 'ABC 123X', expected: false, description: 'Invalid - doesn\'t start with K' },
    { input: 'K12 345A', expected: false, description: 'Invalid - digits in series' },
    { input: 'KAA 12A', expected: false, description: 'Invalid - only 2 digits' },
    { input: 'KAA 1234A', expected: false, description: 'Invalid - 4 digits' },
    { input: 'KAA 123', expected: false, description: 'Invalid - missing check letter' },
    { input: 'KAA 123AB', expected: false, description: 'Invalid - 2 check letters' },
  ];
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach(test => {
    const result = kenyanPlatePattern.test(test.input.trim().toUpperCase());
    const status = result === test.expected ? '✅' : '❌';
    
    if (result === test.expected) {
      passed++;
    } else {
      failed++;
    }
    
    console.log(`${status} "${test.input}" - ${test.description} (Expected: ${test.expected}, Got: ${result})`);
  });
  
  console.log(`\nValidation Results: ${passed}/${testCases.length} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('✅ All plate validation tests passed!');
    return true;
  } else {
    console.error('❌ Some plate validation tests failed');
    return false;
  }
}

// Test 3: Check PolicyDetailsStep integration
function testPolicyDetailsIntegration() {
  console.log('\n========================================');
  console.log('TEST 3: PolicyDetailsStep DMVIC Integration');
  console.log('========================================\n');
  
  console.log('Checklist for PolicyDetailsStep.js:');
  console.log('');
  console.log('1. onRegistrationChange prop passed to DynamicVehicleForm?');
  console.log('   - Check line ~218 in PolicyDetailsStep.js');
  console.log('   - Should have: onRegistrationChange={handleRegistrationChange}');
  console.log('');
  console.log('2. handleRegistrationChange triggers performDMVICCheck?');
  console.log('   - Check line ~182 in PolicyDetailsStep.js');
  console.log('   - Should call: debouncedDMVICCheck(regNumber, coverDate)');
  console.log('');
  console.log('3. performDMVICCheck makes API call?');
  console.log('   - Check line ~104 in PolicyDetailsStep.js');
  console.log('   - Should call: djangoAPI.makeRequest(\'/api/insurance/dmvic/search-vehicle/\', {...})');
  console.log('');
  console.log('4. processDMVICResult updates context?');
  console.log('   - Check line ~43 in PolicyDetailsStep.js');
  console.log('   - Should call: actions.setExistingCoverData({...})');
  console.log('   - Should call: actions.setShowVerificationScreen(true)');
  console.log('');
  console.log('5. Modal rendered in MotorInsuranceContainer?');
  console.log('   - Check line ~387 in MotorInsuranceContainer.js');
  console.log('   - Should have: <Modal visible={state.showVerificationScreen}>');
  console.log('');
  console.log('🔍 To verify, add console.log statements at each step and watch logs when typing registration number');
}

// Run all tests
async function runDiagnostics() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   DMVIC Integration Diagnostic Tool           ║');
  console.log('║   Motor 2 Flow - PataBima Insurance App       ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  
  console.log('Running diagnostics...\n');
  
  // Test 1: Endpoint
  const endpointOK = await testDMVICEndpoint();
  
  // Test 2: Validation
  const validationOK = testPlateValidation();
  
  // Test 3: Integration checklist
  testPolicyDetailsIntegration();
  
  console.log('\n========================================');
  console.log('DIAGNOSTIC SUMMARY');
  console.log('========================================\n');
  
  console.log('DMVIC Endpoint:', endpointOK ? '✅ PASS' : '❌ FAIL');
  console.log('Plate Validation:', validationOK ? '✅ PASS' : '❌ FAIL');
  console.log('Integration:', '⚠️  MANUAL CHECK REQUIRED');
  
  console.log('\n========================================');
  console.log('NEXT STEPS');
  console.log('========================================\n');
  
  if (!endpointOK) {
    console.log('1. ❌ Fix backend connectivity first');
    console.log('   - Start backend: cd insurance-app && python manage.py runserver');
    console.log('   - Check network settings');
    console.log('   - Verify API_CONFIG.BASE_URL in DjangoAPIService.js');
  } else if (!validationOK) {
    console.log('2. ❌ Fix plate validation regex');
    console.log('   - Update pattern in DynamicVehicleForm.js line ~655');
  } else {
    console.log('3. ✅ Backend and validation OK - Test in app:');
    console.log('   - Open Motor 2 flow');
    console.log('   - Enter registration: KAA 123A');
    console.log('   - Watch console for:');
    console.log('     [DynamicVehicleForm] Registration changed, triggering DMVIC check: KAA 123A');
    console.log('     [DMVIC PolicyDetails] Starting check for: KAA123A');
    console.log('     [DMVIC PolicyDetails] API Response: {...}');
    console.log('     [DMVIC PolicyDetails] Existing cover found (if applicable)');
  }
  
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   Diagnostic Complete                          ║');
  console.log('╚════════════════════════════════════════════════╝\n');
}

// Auto-run if in Node/test environment
if (typeof module !== 'undefined' && module.exports) {
  runDiagnostics();
}

// Export for manual use
if (typeof window !== 'undefined') {
  window.runDMVICDiagnostics = runDiagnostics;
  console.log('✅ Diagnostic tool loaded! Run: window.runDMVICDiagnostics()');
}
