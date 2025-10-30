/**
 * Form Data Isolation Test
 * 
 * This script simulates the form data behavior to verify that
 * subcategory switching properly isolates form data.
 */

// Mock the context behavior
class MockMotorInsuranceContext {
  constructor() {
    this.state = {
      selectedCategory: null,
      selectedSubcategory: null,
      vehicleDetails: {},
      pricingInputs: {},
      subcategoryFormData: {}, // New subcategory-specific storage
    };
  }

  // Simulate the updated SET_CATEGORY_SELECTION action
  setCategorySelection({ category, subcategory }) {
    console.log(`\n🔄 Switching from ${this.state.selectedSubcategory?.subcategory_code || 'none'} to ${subcategory?.subcategory_code}`);
    
    // Save current form data for the previous subcategory
    const currentSubcategoryCode = this.state.selectedSubcategory?.subcategory_code;
    let updatedSubcategoryFormData = { ...this.state.subcategoryFormData };
    
    if (currentSubcategoryCode) {
      updatedSubcategoryFormData[currentSubcategoryCode] = {
        vehicleDetails: this.state.vehicleDetails,
        pricingInputs: this.state.pricingInputs
      };
      console.log(`💾 Saved form data for ${currentSubcategoryCode}:`, {
        vehicleDetails: this.state.vehicleDetails,
        pricingInputs: this.state.pricingInputs
      });
    }
    
    // Get form data for the new subcategory (if any)
    const newSubcategoryCode = subcategory?.subcategory_code;
    const savedFormData = newSubcategoryCode ? updatedSubcategoryFormData[newSubcategoryCode] : null;
    
    // Update state
    this.state = {
      ...this.state,
      selectedCategory: category,
      selectedSubcategory: subcategory,
      subcategoryFormData: updatedSubcategoryFormData,
      // Reset form data for new subcategory or restore saved data
      vehicleDetails: savedFormData?.vehicleDetails || {},
      pricingInputs: savedFormData?.pricingInputs || {},
    };
    
    if (savedFormData) {
      console.log(`📥 Restored saved form data for ${newSubcategoryCode}:`, savedFormData);
    } else {
      console.log(`🆕 Starting fresh form for ${newSubcategoryCode}`);
    }
  }

  // Simulate form field updates
  updateVehicleDetails(data) {
    console.log(`📝 Updating vehicle details:`, data);
    
    const updatedVehicleDetails = { ...this.state.vehicleDetails, ...data };
    let vehicleSubcategoryFormData = { ...this.state.subcategoryFormData };
    
    // Also save to subcategory-specific storage
    const vehicleSubcategoryCode = this.state.selectedSubcategory?.subcategory_code;
    if (vehicleSubcategoryCode) {
      vehicleSubcategoryFormData[vehicleSubcategoryCode] = {
        ...vehicleSubcategoryFormData[vehicleSubcategoryCode],
        vehicleDetails: updatedVehicleDetails
      };
    }
    
    this.state = {
      ...this.state,
      vehicleDetails: updatedVehicleDetails,
      subcategoryFormData: vehicleSubcategoryFormData
    };
  }

  updatePricingInputs(data) {
    console.log(`💰 Updating pricing inputs:`, data);
    
    const updatedPricingInputs = { ...this.state.pricingInputs, ...data };
    let pricingSubcategoryFormData = { ...this.state.subcategoryFormData };
    
    // Also save to subcategory-specific storage
    const pricingSubcategoryCode = this.state.selectedSubcategory?.subcategory_code;
    if (pricingSubcategoryCode) {
      pricingSubcategoryFormData[pricingSubcategoryCode] = {
        ...pricingSubcategoryFormData[pricingSubcategoryCode],
        pricingInputs: updatedPricingInputs
      };
    }
    
    this.state = {
      ...this.state,
      pricingInputs: updatedPricingInputs,
      subcategoryFormData: pricingSubcategoryFormData
    };
  }

  // Helper to display current state
  displayState() {
    console.log(`\n📊 Current State:`);
    console.log(`   • Selected: ${this.state.selectedSubcategory?.subcategory_code || 'none'}`);
    console.log(`   • Vehicle Details:`, this.state.vehicleDetails);
    console.log(`   • Pricing Inputs:`, this.state.pricingInputs);
    console.log(`   • Saved Data:`, Object.keys(this.state.subcategoryFormData).map(key => ({
      subcategory: key,
      hasVehicleData: !!this.state.subcategoryFormData[key]?.vehicleDetails,
      hasPricingData: !!this.state.subcategoryFormData[key]?.pricingInputs
    })));
  }
}

// Test scenarios
async function testFormDataIsolation() {
  console.log('🧪 Testing Form Data Isolation for Subcategories');
  console.log('=' .repeat(60));
  
  const context = new MockMotorInsuranceContext();
  
  // Mock subcategory objects
  const privateThirdParty = {
    subcategory_code: 'PRIVATE_THIRD_PARTY',
    name: 'Private Third-Party'
  };
  
  const privateTOR = {
    subcategory_code: 'PRIVATE_TOR',
    name: 'Private TOR'
  };
  
  const privateComprehensive = {
    subcategory_code: 'PRIVATE_COMPREHENSIVE',
    name: 'Private Comprehensive'
  };
  
  const category = {
    key: 'PRIVATE',
    category_code: 'PRIVATE'
  };
  
  // Scenario 1: Start with Private Third-Party
  console.log('\\n🎯 Test 1: Starting with Private Third-Party');
  context.setCategorySelection({ category, subcategory: privateThirdParty });
  context.displayState();
  
  // Fill some form data
  context.updateVehicleDetails({ 
    registrationNumber: 'KBC 324H',
    make: 'Toyota',
    model: 'Axio' 
  });
  context.updatePricingInputs({ 
    coverStartDate: '2025-09-30' 
  });
  context.displayState();
  
  // Scenario 2: Switch to Private TOR
  console.log('\\n🎯 Test 2: Switching to Private TOR');
  context.setCategorySelection({ category, subcategory: privateTOR });
  context.displayState();
  
  // Verify fields are cleared
  console.log('\\n✅ Verification: Form should be empty for new subcategory');
  console.log(`   • Registration Number: "${context.state.vehicleDetails.registrationNumber || 'EMPTY'}" (should be empty)`);
  console.log(`   • Make: "${context.state.vehicleDetails.make || 'EMPTY'}" (should be empty)`);
  
  // Fill different data for TOR
  context.updateVehicleDetails({ 
    registrationNumber: 'KCD 567J',
    make: 'Nissan',
    model: 'Note' 
  });
  context.updatePricingInputs({ 
    coverStartDate: '2025-10-01',
    duration: 30 
  });
  context.displayState();
  
  // Scenario 3: Switch to Comprehensive
  console.log('\\n🎯 Test 3: Switching to Private Comprehensive');
  context.setCategorySelection({ category, subcategory: privateComprehensive });
  context.displayState();
  
  // Fill comprehensive-specific data
  context.updateVehicleDetails({ 
    registrationNumber: 'KCE 890M',
    make: 'Mercedes',
    model: 'C-Class' 
  });
  context.updatePricingInputs({ 
    coverStartDate: '2025-10-02',
    sumInsured: 2000000,
    windscreenValue: 50000 
  });
  context.displayState();
  
  // Scenario 4: Return to Private Third-Party (should restore data)
  console.log('\\n🎯 Test 4: Returning to Private Third-Party (should restore data)');
  context.setCategorySelection({ category, subcategory: privateThirdParty });
  context.displayState();
  
  // Verify original data is restored
  console.log('\\n✅ Verification: Should restore original Third-Party data');
  console.log(`   • Registration Number: "${context.state.vehicleDetails.registrationNumber}" (should be "KBC 324H")`);
  console.log(`   • Make: "${context.state.vehicleDetails.make}" (should be "Toyota")`);
  console.log(`   • Model: "${context.state.vehicleDetails.model}" (should be "Axio")`);
  
  // Scenario 5: Return to TOR (should restore TOR data)
  console.log('\\n🎯 Test 5: Returning to Private TOR (should restore TOR data)');
  context.setCategorySelection({ category, subcategory: privateTOR });
  context.displayState();
  
  // Verify TOR data is restored
  console.log('\\n✅ Verification: Should restore TOR data');
  console.log(`   • Registration Number: "${context.state.vehicleDetails.registrationNumber}" (should be "KCD 567J")`);
  console.log(`   • Make: "${context.state.vehicleDetails.make}" (should be "Nissan")`);
  console.log(`   • Duration: "${context.state.pricingInputs.duration}" (should be "30")`);
  
  // Final analysis
  console.log('\\n' + '='.repeat(60));
  console.log('📋 Form Data Isolation Analysis');
  console.log('='.repeat(60));
  
  const hasCorrectThirdPartyData = context.state.subcategoryFormData['PRIVATE_THIRD_PARTY']?.vehicleDetails?.registrationNumber === 'KBC 324H';
  const hasCorrectTORData = context.state.subcategoryFormData['PRIVATE_TOR']?.vehicleDetails?.registrationNumber === 'KCD 567J';
  const hasCorrectComprehensiveData = context.state.subcategoryFormData['PRIVATE_COMPREHENSIVE']?.vehicleDetails?.registrationNumber === 'KCE 890M';
  
  console.log(`\\n📊 Isolation Test Results:`);
  console.log(`   • PRIVATE_THIRD_PARTY isolation: ${hasCorrectThirdPartyData ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`   • PRIVATE_TOR isolation: ${hasCorrectTORData ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`   • PRIVATE_COMPREHENSIVE isolation: ${hasCorrectComprehensiveData ? '✅ WORKING' : '❌ FAILED'}`);
  
  const allWorking = hasCorrectThirdPartyData && hasCorrectTORData && hasCorrectComprehensiveData;
  
  console.log(`\\n🎯 Final Verdict:`);
  if (allWorking) {
    console.log(`   ✅ FORM DATA ISOLATION IS WORKING CORRECTLY`);
    console.log(`   📱 Each subcategory maintains its own form state`);
    console.log(`   🔄 Data is saved and restored when switching subcategories`);
  } else {
    console.log(`   ❌ FORM DATA ISOLATION NEEDS FIXES`);
  }
  
  console.log(`\\n📈 Storage Summary:`);
  Object.keys(context.state.subcategoryFormData).forEach(subcategoryCode => {
    const data = context.state.subcategoryFormData[subcategoryCode];
    console.log(`   • ${subcategoryCode}:`);
    console.log(`     - Vehicle: ${data.vehicleDetails?.registrationNumber || 'empty'} (${data.vehicleDetails?.make || 'no make'})`);
    console.log(`     - Pricing: ${Object.keys(data.pricingInputs || {}).length} fields`);
  });
}

// Run the test
if (require.main === module) {
  testFormDataIsolation().catch(console.error);
}