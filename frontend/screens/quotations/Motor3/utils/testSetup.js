/**
 * Motor3 Static Categories Setup Verification
 * 
 * Run this script to verify everything is set up correctly.
 * 
 * Usage:
 *   node frontend/screens/quotations/Motor3/utils/testSetup.js
 *   or import and run testSetup() in your app
 */

// Test 1: Static Categories Import
function testStaticCategories() {
  console.log('\n📦 Test 1: Static Categories Import');
  try {
    const staticCategories = require('../constants/staticCategories');
    
    // Check exports
    const requiredExports = [
      'MOTOR_CATEGORIES',
      'MOTOR_SUBCATEGORIES',
      'CATEGORY_VERSION',
      'LAST_CATEGORY_UPDATE',
      'getActiveCategories',
      'getCategoryByCode',
      'getSubcategoryByCode',
      'isThirdPartyLike',
    ];
    
    const missingExports = requiredExports.filter(
      exp => !staticCategories[exp]
    );
    
    if (missingExports.length > 0) {
      console.error('❌ FAIL: Missing exports:', missingExports);
      return false;
    }
    
    // Check data structure
    const categories = staticCategories.MOTOR_CATEGORIES;
    const subcategories = staticCategories.MOTOR_SUBCATEGORIES;
    
    if (!Array.isArray(categories) || categories.length === 0) {
      console.error('❌ FAIL: MOTOR_CATEGORIES is empty or invalid');
      return false;
    }
    
    if (typeof subcategories !== 'object' || Object.keys(subcategories).length === 0) {
      console.error('❌ FAIL: MOTOR_SUBCATEGORIES is empty or invalid');
      return false;
    }
    
    console.log(`✅ PASS: Found ${categories.length} categories`);
    console.log(`✅ PASS: Found ${Object.keys(subcategories).length} category groups`);
    console.log(`   Version: ${staticCategories.CATEGORY_VERSION}`);
    console.log(`   Last Updated: ${staticCategories.LAST_CATEGORY_UPDATE}`);
    
    return true;
  } catch (error) {
    console.error('❌ FAIL:', error.message);
    return false;
  }
}

// Test 2: Field Generator Import
function testFieldGenerator() {
  console.log('\n🔧 Test 2: Field Generator Import');
  try {
    const fieldGenerator = require('../utils/fieldGenerator');
    
    // Check exports
    const requiredExports = [
      'generateFormFields',
      'FIELD_TYPES',
      'getFieldByKey',
      'validateFormData',
    ];
    
    const missingExports = requiredExports.filter(
      exp => !fieldGenerator[exp]
    );
    
    if (missingExports.length > 0) {
      console.error('❌ FAIL: Missing exports:', missingExports);
      return false;
    }
    
    console.log('✅ PASS: All field generator functions available');
    
    return true;
  } catch (error) {
    console.error('❌ FAIL:', error.message);
    return false;
  }
}

// Test 3: Category Version Checker Import
function testVersionChecker() {
  console.log('\n🔍 Test 3: Version Checker Import');
  try {
    const versionChecker = require('../utils/categoryVersionChecker');
    
    // Check exports
    const requiredExports = [
      'checkCategoryVersion',
      'autoCheckVersionInDev',
    ];
    
    const missingExports = requiredExports.filter(
      exp => !versionChecker[exp]
    );
    
    if (missingExports.length > 0) {
      console.error('❌ FAIL: Missing exports:', missingExports);
      return false;
    }
    
    console.log('✅ PASS: Version checker functions available');
    
    return true;
  } catch (error) {
    console.error('❌ FAIL:', error.message);
    return false;
  }
}

// Test 4: Field Generation
function testFieldGeneration() {
  console.log('\n⚙️ Test 4: Field Generation');
  try {
    const { generateFormFields } = require('../utils/fieldGenerator');
    
    // Test Third Party (should have 5 fields)
    const thirdPartyFields = generateFormFields('PRIVATE_THIRD_PARTY', {});
    
    if (!Array.isArray(thirdPartyFields)) {
      console.error('❌ FAIL: generateFormFields did not return array');
      return false;
    }
    
    if (thirdPartyFields.length !== 5) {
      console.error(`❌ FAIL: Expected 5 fields for Third Party, got ${thirdPartyFields.length}`);
      return false;
    }
    
    console.log(`✅ PASS: Third Party generates ${thirdPartyFields.length} fields`);
    console.log(`   Fields: ${thirdPartyFields.map(f => f.key).join(', ')}`);
    
    // Test Comprehensive (should have more fields)
    const comprehensiveFields = generateFormFields('PRIVATE_COMPREHENSIVE', {
      identificationType: 'Vehicle Registration',
      make: 'Toyota',
    });
    
    if (comprehensiveFields.length < 9) {
      console.error(`❌ FAIL: Expected 9+ fields for Comprehensive, got ${comprehensiveFields.length}`);
      return false;
    }
    
    console.log(`✅ PASS: Comprehensive generates ${comprehensiveFields.length} fields`);
    
    return true;
  } catch (error) {
    console.error('❌ FAIL:', error.message);
    return false;
  }
}

// Test 5: Category Lookup
function testCategoryLookup() {
  console.log('\n🔎 Test 5: Category Lookup Functions');
  try {
    const {
      getCategoryByCode,
      getSubcategoryByCode,
      isThirdPartyLike,
    } = require('../constants/staticCategories');
    
    // Test getCategoryByCode
    const privateCategory = getCategoryByCode('PRIVATE');
    if (!privateCategory || privateCategory.code !== 'PRIVATE') {
      console.error('❌ FAIL: getCategoryByCode("PRIVATE") failed');
      return false;
    }
    console.log('✅ PASS: getCategoryByCode works');
    
    // Test getSubcategoryByCode
    const thirdParty = getSubcategoryByCode('PRIVATE_THIRD_PARTY');
    if (!thirdParty || thirdParty.subcategory_code !== 'PRIVATE_THIRD_PARTY') {
      console.error('❌ FAIL: getSubcategoryByCode("PRIVATE_THIRD_PARTY") failed');
      return false;
    }
    console.log('✅ PASS: getSubcategoryByCode works');
    
    // Test isThirdPartyLike
    const isTP = isThirdPartyLike('PRIVATE_THIRD_PARTY');
    if (!isTP) {
      console.error('❌ FAIL: isThirdPartyLike("PRIVATE_THIRD_PARTY") should be true');
      return false;
    }
    
    const isNotTP = isThirdPartyLike('PRIVATE_COMPREHENSIVE');
    if (isNotTP) {
      console.error('❌ FAIL: isThirdPartyLike("PRIVATE_COMPREHENSIVE") should be false');
      return false;
    }
    
    console.log('✅ PASS: isThirdPartyLike works correctly');
    
    return true;
  } catch (error) {
    console.error('❌ FAIL:', error.message);
    return false;
  }
}

// Test 6: Data Completeness
function testDataCompleteness() {
  console.log('\n📊 Test 6: Data Completeness');
  try {
    const {
      MOTOR_CATEGORIES,
      MOTOR_SUBCATEGORIES,
    } = require('../constants/staticCategories');
    
    // Expected categories
    const expectedCategories = ['PRIVATE', 'COMMERCIAL', 'PSV', 'MOTORCYCLE', 'TUKTUK', 'SPECIAL'];
    const actualCategories = MOTOR_CATEGORIES.map(c => c.code);
    
    const missingCategories = expectedCategories.filter(
      code => !actualCategories.includes(code)
    );
    
    if (missingCategories.length > 0) {
      console.error('❌ FAIL: Missing categories:', missingCategories);
      return false;
    }
    
    console.log('✅ PASS: All 6 expected categories present');
    
    // Check each category has subcategories
    for (const categoryCode of expectedCategories) {
      const subs = MOTOR_SUBCATEGORIES[categoryCode];
      if (!subs || subs.length === 0) {
        console.error(`❌ FAIL: No subcategories for ${categoryCode}`);
        return false;
      }
    }
    
    const totalSubcategories = Object.values(MOTOR_SUBCATEGORIES)
      .flat()
      .length;
    
    console.log(`✅ PASS: All categories have subcategories (${totalSubcategories} total)`);
    
    return true;
  } catch (error) {
    console.error('❌ FAIL:', error.message);
    return false;
  }
}

// Test 7: Field Validation
function testFieldValidation() {
  console.log('\n✔️ Test 7: Field Validation');
  try {
    const { validateFormData, generateFormFields } = require('../utils/fieldGenerator');
    
    const fields = generateFormFields('PRIVATE_THIRD_PARTY', {});
    
    // Test with empty data (should have errors)
    const emptyResult = validateFormData(fields, {});
    if (emptyResult.isValid) {
      console.error('❌ FAIL: Empty form should not be valid');
      return false;
    }
    console.log(`✅ PASS: Empty form validation works (${Object.keys(emptyResult.errors).length} errors)`);
    
    // Test with complete data (should be valid)
    const completeData = {
      financialInterest: 'Yes',
      identificationType: 'Vehicle Registration',
      registrationNumber: 'KDA 123A',
      cover_start_date: '2025-12-04',
    };
    const completeResult = validateFormData(fields, completeData);
    if (!completeResult.isValid) {
      console.error('❌ FAIL: Complete form should be valid');
      console.error('Errors:', completeResult.errors);
      return false;
    }
    console.log('✅ PASS: Complete form validation works');
    
    return true;
  } catch (error) {
    console.error('❌ FAIL:', error.message);
    return false;
  }
}

// Main test runner
function runAllTests() {
  console.log('🚀 Motor3 Static Categories Setup Verification\n');
  console.log('=' .repeat(60));
  
  const tests = [
    { name: 'Static Categories Import', fn: testStaticCategories },
    { name: 'Field Generator Import', fn: testFieldGenerator },
    { name: 'Version Checker Import', fn: testVersionChecker },
    { name: 'Field Generation', fn: testFieldGeneration },
    { name: 'Category Lookup', fn: testCategoryLookup },
    { name: 'Data Completeness', fn: testDataCompleteness },
    { name: 'Field Validation', fn: testFieldValidation },
  ];
  
  const results = tests.map(test => ({
    name: test.name,
    passed: test.fn(),
  }));
  
  console.log('\n' + '=' .repeat(60));
  console.log('📋 TEST SUMMARY\n');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
  });
  
  console.log('\n' + '=' .repeat(60));
  
  if (passed === total) {
    console.log(`\n🎉 ALL TESTS PASSED (${passed}/${total})`);
    console.log('\n✅ Motor3 Static Categories system is READY TO USE!');
    console.log('\nNext steps:');
    console.log('  1. Check QUICK_REFERENCE.md for usage examples');
    console.log('  2. See examples/TPVehicleFormWithGenerator.js for implementation');
    console.log('  3. Update your TPVehicleForm to use field generator');
    return true;
  } else {
    console.log(`\n❌ TESTS FAILED (${passed}/${total} passed)`);
    console.log('\nPlease fix the errors above before using the system.');
    return false;
  }
}

// Export for use in React Native app
export const testSetup = runAllTests;

// Run if called directly (Node.js)
if (require.main === module) {
  const success = runAllTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runAllTests, testSetup };
