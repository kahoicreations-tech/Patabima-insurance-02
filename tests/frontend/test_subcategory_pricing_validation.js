/**
 * Test Script: Subcategory-Specific Pricing Validation
 * 
 * This script tests whether pricing comparisons are working correctly per subcategory
 * by making direct API calls to different subcategories and verifying the responses.
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://127.0.0.1:8000';

// Test scenarios for different subcategories
const testScenarios = [
  {
    name: 'Private Third-Party',
    subcategory: 'PRIVATE_THIRD_PARTY',
    category: 'PRIVATE',
    expected_product_type: 'THIRD_PARTY',
    test_data: {
      vehicle_registration: 'KBC 324H',
      cover_start_date: '2025-09-30',
      customer_first_name: 'John',
      customer_last_name: 'Doe',
      customer_phone: '254712345678',
      customer_email: 'john@example.com',
      duration_days: 30
    }
  },
  {
    name: 'Private TOR',
    subcategory: 'PRIVATE_TOR',
    category: 'PRIVATE',
    expected_product_type: 'TOR',
    test_data: {
      vehicle_registration: 'KBC 324H',
      cover_start_date: '2025-09-30',
      customer_first_name: 'Jane',
      customer_last_name: 'Smith',
      customer_phone: '254712345679',
      customer_email: 'jane@example.com',
      duration_days: 30
    }
  },
  {
    name: 'Private Comprehensive',
    subcategory: 'PRIVATE_COMPREHENSIVE',
    category: 'PRIVATE',
    expected_product_type: 'COMPREHENSIVE',
    test_data: {
      vehicle_registration: 'KBC 324H',
      cover_start_date: '2025-09-30',
      customer_first_name: 'Alice',
      customer_last_name: 'Johnson',
      customer_phone: '254712345680',
      customer_email: 'alice@example.com',
      duration_days: 365,
      sum_insured: 800000,
      vehicle_year: 2018
    }
  }
];

// Test helper functions
async function testSubcategoryPricing(scenario) {
  console.log(`\n🧪 Testing: ${scenario.name} (${scenario.subcategory})`);
  console.log('=' .repeat(60));
  
  const payload = {
    subcategory: scenario.subcategory,
    subcategory_code: scenario.subcategory,
    ...scenario.test_data
  };
  
  try {
    const response = await fetch(`${BASE_URL}/api/v1/public_app/insurance/compare_motor_pricing/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    console.log(`📊 API Response Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log(`✅ SUCCESS: ${scenario.name} pricing comparison working`);
      console.log(`📈 Underwriters responding: ${data.comparisons?.length || 0}`);
      
      if (data.comparisons && data.comparisons.length > 0) {
        console.log('\n💰 Pricing Summary:');
        
        // Group prices for analysis
        const prices = data.comparisons.map(comp => {
          const result = comp.result || comp;
          return {
            underwriter: result.underwriter_name || result.underwriter_code,
            base_premium: result.base_premium || 0,
            total_premium: result.total_premium || 0
          };
        });
        
        // Sort by total premium
        prices.sort((a, b) => a.total_premium - b.total_premium);
        
        prices.forEach((price, index) => {
          const position = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
          console.log(`${position} ${price.underwriter}: KSh ${price.total_premium.toLocaleString()} (Base: KSh ${price.base_premium.toLocaleString()})`);
        });
        
        // Calculate price range
        const minPrice = Math.min(...prices.map(p => p.total_premium));
        const maxPrice = Math.max(...prices.map(p => p.total_premium));
        const priceRange = ((maxPrice - minPrice) / minPrice * 100).toFixed(1);
        
        console.log(`\n📊 Price Analysis:`);
        console.log(`   • Range: KSh ${minPrice.toLocaleString()} - KSh ${maxPrice.toLocaleString()}`);
        console.log(`   • Variation: ${priceRange}% difference between cheapest and most expensive`);
        
        return {
          success: true,
          subcategory: scenario.subcategory,
          underwriter_count: prices.length,
          price_range: { min: minPrice, max: maxPrice },
          variation_percent: parseFloat(priceRange)
        };
      } else {
        console.log('⚠️  WARNING: No underwriter comparisons returned');
        return { success: false, error: 'No comparisons returned' };
      }
    } else {
      console.log(`❌ ERROR: ${scenario.name} pricing comparison failed`);
      console.log(`📄 Error details:`, data);
      return { success: false, error: data, status: response.status };
    }
    
  } catch (error) {
    console.log(`💥 EXCEPTION: ${scenario.name} pricing comparison crashed`);
    console.log(`🔍 Error:`, error.message);
    return { success: false, error: error.message };
  }
}

// Analysis functions
function analyzeResults(results) {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 SUBCATEGORY PRICING ANALYSIS SUMMARY');
  console.log('='.repeat(80));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\n📈 Overall Results:`);
  console.log(`   • Successful tests: ${successful.length}/${results.length}`);
  console.log(`   • Failed tests: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    console.log(`\n✅ Working Subcategories:`);
    successful.forEach(result => {
      console.log(`   • ${result.subcategory}: ${result.underwriter_count} underwriters, ${result.variation_percent}% price variation`);
    });
    
    // Check if pricing is truly different between subcategories
    if (successful.length >= 2) {
      console.log(`\n🔍 Subcategory Differentiation Analysis:`);
      
      const priceRanges = successful.map(r => ({
        subcategory: r.subcategory,
        minPrice: r.price_range.min,
        maxPrice: r.price_range.max
      }));
      
      // Compare different subcategories
      for (let i = 0; i < priceRanges.length; i++) {
        for (let j = i + 1; j < priceRanges.length; j++) {
          const sub1 = priceRanges[i];
          const sub2 = priceRanges[j];
          
          const overlap = !(sub1.maxPrice < sub2.minPrice || sub2.maxPrice < sub1.minPrice);
          const distinctPricing = !overlap || Math.abs(sub1.minPrice - sub2.minPrice) > 100;
          
          if (distinctPricing) {
            console.log(`   ✅ ${sub1.subcategory} vs ${sub2.subcategory}: Different pricing confirmed`);
          } else {
            console.log(`   ⚠️  ${sub1.subcategory} vs ${sub2.subcategory}: Similar pricing (potential issue)`);
          }
        }
      }
    }
  }
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed Subcategories:`);
    failed.forEach(result => {
      console.log(`   • ${result.subcategory}: ${result.error}`);
    });
  }
  
  // Final verdict
  console.log(`\n🎯 VERDICT:`);
  if (successful.length === results.length && successful.length >= 2) {
    console.log(`   ✅ SUBCATEGORY-SPECIFIC PRICING IS WORKING CORRECTLY`);
    console.log(`   📊 Each subcategory returns different pricing as expected`);
  } else if (successful.length > 0) {
    console.log(`   ⚠️  PARTIAL SUCCESS - Some subcategories working`);
    console.log(`   🔧 Need to investigate failed subcategories`);
  } else {
    console.log(`   ❌ SUBCATEGORY PRICING NOT WORKING`);
    console.log(`   🚨 All tests failed - major issue detected`);
  }
}

// Main test execution
async function runPricingValidation() {
  console.log('🚀 Starting Subcategory-Specific Pricing Validation Test');
  console.log('📅 Date:', new Date().toISOString());
  console.log('🌐 Backend URL:', BASE_URL);
  
  const results = [];
  
  // Test each subcategory
  for (const scenario of testScenarios) {
    const result = await testSubcategoryPricing(scenario);
    results.push({ subcategory: scenario.subcategory, ...result });
  }
  
  // Analyze results
  analyzeResults(results);
  
  console.log('\n✨ Test completed!');
}

// Execute the tests
if (require.main === module) {
  runPricingValidation().catch(console.error);
}

module.exports = { runPricingValidation, testSubcategoryPricing };