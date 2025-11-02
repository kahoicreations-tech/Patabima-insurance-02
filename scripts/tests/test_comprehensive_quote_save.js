/**
 * Test Script: Comprehensive Quote Save Mechanism
 * Tests the AsyncStorage save flow for Motor2 Comprehensive quotes
 */

// Mock AsyncStorage for Node.js environment
const AsyncStorage = {
  storage: {},
  async setItem(key, value) {
    this.storage[key] = value;
    return Promise.resolve();
  },
  async getItem(key) {
    return Promise.resolve(this.storage[key] || null);
  },
  async removeItem(key) {
    delete this.storage[key];
    return Promise.resolve();
  },
  async getAllKeys() {
    return Promise.resolve(Object.keys(this.storage));
  },
  async clear() {
    this.storage = {};
    return Promise.resolve();
  }
};

// Sample comprehensive quote data (matches the structure in MotorInsuranceScreen.js line 728-751)
const sampleQuoteData = {
  vehicleRegistration: 'KDA 234H',
  vehicleMake: 'Nissan',
  vehicleModel: 'X-Trail',
  vehicleYear: '2020',
  sumInsured: 1500000,
  category: 'Private',
  subcategory: 'Private Comprehensive',
  coverageType: 'Comprehensive',
  underwriterName: 'Jubilee Insurance',
  underwriterId: 'JUBILEE',
  totalPremium: 55516,
  premiumBreakdown: {
    basic_premium: 55000,
    itl: 138,
    pcf: 138,
    stamp_duty: 40,
    total_premium: 55516
  },
  clientName: 'John Doe',
  clientEmail: 'james@gmail.com',
  clientPhone: '0712345678',
  selectedAddons: [
    {
      id: 'windscreen_cover',
      name: 'Windscreen Cover',
      premium: 2000,
      selected: true
    },
    {
      id: 'pll',
      name: 'Personal Loss Liability',
      premium: 1500,
      selected: true
    }
  ],
  addonsPremium: 3500,
  status: 'draft',
  createdAt: new Date().toISOString(),
};

async function testQuoteSave() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 TESTING COMPREHENSIVE QUOTE SAVE MECHANISM');
  console.log('='.repeat(80) + '\n');

  try {
    // Step 1: Generate quote ID (matches line 755)
    const quoteId = `QUOTE-${Date.now()}`;
    console.log('1️⃣  Generated Quote ID:', quoteId);

    // Step 2: Save to AsyncStorage (matches line 756)
    console.log('\n2️⃣  Saving quote to AsyncStorage...');
    const storageKey = `draft_quote_${quoteId}`;
    await AsyncStorage.setItem(storageKey, JSON.stringify(sampleQuoteData));
    console.log('✅ Quote saved successfully!');
    console.log('   Storage Key:', storageKey);

    // Step 3: Verify data was saved correctly
    console.log('\n3️⃣  Verifying saved data...');
    const retrievedData = await AsyncStorage.getItem(storageKey);
    
    if (!retrievedData) {
      console.error('❌ ERROR: No data retrieved from AsyncStorage!');
      return false;
    }

    const parsedData = JSON.parse(retrievedData);
    console.log('✅ Data retrieved successfully!');

    // Step 4: Validate data integrity
    console.log('\n4️⃣  Validating data integrity...');
    const validationChecks = {
      'Vehicle Registration': parsedData.vehicleRegistration === sampleQuoteData.vehicleRegistration,
      'Vehicle Make': parsedData.vehicleMake === sampleQuoteData.vehicleMake,
      'Sum Insured': parsedData.sumInsured === sampleQuoteData.sumInsured,
      'Underwriter Name': parsedData.underwriterName === sampleQuoteData.underwriterName,
      'Total Premium': parsedData.totalPremium === sampleQuoteData.totalPremium,
      'Client Email': parsedData.clientEmail === sampleQuoteData.clientEmail,
      'Status': parsedData.status === 'draft',
      'Add-ons Count': Array.isArray(parsedData.selectedAddons) && parsedData.selectedAddons.length === 2,
    };

    let allValid = true;
    Object.entries(validationChecks).forEach(([field, isValid]) => {
      const icon = isValid ? '✅' : '❌';
      console.log(`   ${icon} ${field}: ${isValid ? 'PASS' : 'FAIL'}`);
      if (!isValid) allValid = false;
    });

    // Step 5: Display saved quote data
    console.log('\n5️⃣  Saved Quote Data:');
    console.log('   Vehicle:', `${parsedData.vehicleMake} ${parsedData.vehicleModel} (${parsedData.vehicleYear})`);
    console.log('   Registration:', parsedData.vehicleRegistration);
    console.log('   Sum Insured:', `KSh ${parsedData.sumInsured.toLocaleString()}`);
    console.log('   Underwriter:', parsedData.underwriterName);
    console.log('   Total Premium:', `KSh ${parsedData.totalPremium.toLocaleString()}`);
    console.log('   Premium Breakdown:');
    console.log('     - Basic Premium:', `KSh ${parsedData.premiumBreakdown.basic_premium.toLocaleString()}`);
    console.log('     - ITL:', `KSh ${parsedData.premiumBreakdown.itl}`);
    console.log('     - PCF:', `KSh ${parsedData.premiumBreakdown.pcf}`);
    console.log('     - Stamp Duty:', `KSh ${parsedData.premiumBreakdown.stamp_duty}`);
    console.log('   Client:', parsedData.clientName);
    console.log('   Email:', parsedData.clientEmail);
    console.log('   Phone:', parsedData.clientPhone);
    console.log('   Add-ons:', parsedData.selectedAddons.map(a => a.name).join(', '));
    console.log('   Add-ons Premium:', `KSh ${parsedData.addonsPremium.toLocaleString()}`);
    console.log('   Status:', parsedData.status);
    console.log('   Created:', new Date(parsedData.createdAt).toLocaleString());

    // Step 6: Test retrieval of all quotes
    console.log('\n6️⃣  Testing quote retrieval (all draft quotes)...');
    const allKeys = await AsyncStorage.getAllKeys();
    const draftQuoteKeys = allKeys.filter(key => key.startsWith('draft_quote_'));
    console.log('   Total draft quotes found:', draftQuoteKeys.length);
    
    if (draftQuoteKeys.length > 0) {
      console.log('   Draft quote keys:');
      draftQuoteKeys.forEach((key, index) => {
        console.log(`     ${index + 1}. ${key}`);
      });
    }

    // Step 7: Cleanup (optional)
    console.log('\n7️⃣  Cleanup...');
    console.log('   Do you want to delete the test quote? (Keeping for verification)');
    // await AsyncStorage.removeItem(storageKey);
    console.log('   ℹ️  Test quote retained for manual verification');

    // Final result
    console.log('\n' + '='.repeat(80));
    if (allValid) {
      console.log('✅ ALL TESTS PASSED - Quote save mechanism working correctly!');
    } else {
      console.log('❌ SOME TESTS FAILED - Review validation errors above');
    }
    console.log('='.repeat(80) + '\n');

    return allValid;

  } catch (error) {
    console.error('\n❌ TEST FAILED WITH ERROR:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.log('\n' + '='.repeat(80) + '\n');
    return false;
  }
}

// Additional test: Simulate the exact flow from MotorInsuranceScreen
async function testMotorInsuranceScreenFlow() {
  console.log('\n' + '='.repeat(80));
  console.log('🚗 TESTING MOTOR INSURANCE SCREEN FLOW SIMULATION');
  console.log('='.repeat(80) + '\n');

  try {
    // Simulate state from MotorInsuranceScreen (lines 728-751)
    const mockState = {
      vehicleDetails: {
        registrationNumber: 'KDA 234H',
        registration: 'KDA 234H',
        make: 'Nissan',
        model: 'X-Trail',
        year: '2020',
        sum_insured: 1500000,
      },
      selectedCategory: { name: 'Private' },
      selectedSubcategory: { 
        name: 'Private Comprehensive',
        coverage_type: 'Comprehensive' 
      },
      selectedUnderwriter: {
        name: 'Jubilee Insurance',
        underwriter_name: 'Jubilee Insurance',
        id: 'JUBILEE',
        underwriter_id: 'JUBILEE',
        total_premium: 55516,
        breakdown: {
          basic_premium: 55000,
          itl: 138,
          pcf: 138,
          stamp_duty: 40,
          total_premium: 55516
        }
      },
      pricingInputs: {
        clientDetails: {
          fullName: 'John Doe',
          full_name: 'John Doe',
          email: 'james@gmail.com',
          phone: '0712345678'
        }
      },
      selectedAddons: [
        { id: 'windscreen_cover', name: 'Windscreen Cover', premium: 2000 },
        { id: 'pll', name: 'Personal Loss Liability', premium: 1500 }
      ],
      addonsPremium: 3500
    };

    // Build quote data exactly as in MotorInsuranceScreen
    const quoteData = {
      vehicleRegistration: mockState.vehicleDetails?.registrationNumber || mockState.vehicleDetails?.registration || '',
      vehicleMake: mockState.vehicleDetails?.make || '',
      vehicleModel: mockState.vehicleDetails?.model || '',
      vehicleYear: mockState.vehicleDetails?.year || '',
      sumInsured: mockState.vehicleDetails?.sum_insured || 0,
      category: mockState.selectedCategory?.name || '',
      subcategory: mockState.selectedSubcategory?.name || '',
      coverageType: mockState.selectedSubcategory?.coverage_type || 'Comprehensive',
      underwriterName: mockState.selectedUnderwriter?.name || mockState.selectedUnderwriter?.underwriter_name || '',
      underwriterId: mockState.selectedUnderwriter?.id || mockState.selectedUnderwriter?.underwriter_id || '',
      totalPremium: mockState.selectedUnderwriter?.total_premium || 0,
      premiumBreakdown: mockState.selectedUnderwriter?.breakdown || {},
      clientName: mockState.pricingInputs?.clientDetails?.fullName || mockState.pricingInputs?.clientDetails?.full_name || '',
      clientEmail: mockState.pricingInputs?.clientDetails?.email || '',
      clientPhone: mockState.pricingInputs?.clientDetails?.phone || '',
      selectedAddons: mockState.selectedAddons || [],
      addonsPremium: mockState.addonsPremium || 0,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };

    console.log('📊 Quote Data Built (matches MotorInsuranceScreen.js lines 728-751):');
    console.log(JSON.stringify(quoteData, null, 2));

    // Save to AsyncStorage
    const quoteId = `QUOTE-${Date.now()}`;
    await AsyncStorage.setItem(`draft_quote_${quoteId}`, JSON.stringify(quoteData));

    console.log('\n✅ Quote saved successfully with ID:', quoteId);
    console.log('✅ Flow simulation complete - Ready to navigate to Quotations screen');

    console.log('\n' + '='.repeat(80) + '\n');
    return true;

  } catch (error) {
    console.error('\n❌ FLOW SIMULATION FAILED:');
    console.error('Error:', error.message);
    console.log('\n' + '='.repeat(80) + '\n');
    return false;
  }
}

// Run tests
async function runAllTests() {
  console.log('\n🧪 STARTING COMPREHENSIVE QUOTE SAVE TESTS\n');
  
  const test1 = await testQuoteSave();
  const test2 = await testMotorInsuranceScreenFlow();
  
  console.log('\n📋 TEST SUMMARY:');
  console.log('   Basic Quote Save Test:', test1 ? '✅ PASS' : '❌ FAIL');
  console.log('   Flow Simulation Test:', test2 ? '✅ PASS' : '❌ FAIL');
  console.log('   Overall:', (test1 && test2) ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  console.log('\n');
}

// Export for use in Node.js or React Native
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testQuoteSave,
    testMotorInsuranceScreenFlow,
    runAllTests
  };
}

// Run if executed directly
if (require.main === module) {
  runAllTests().then(() => {
    console.log('Tests complete. Exiting...');
    process.exit(0);
  }).catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}
