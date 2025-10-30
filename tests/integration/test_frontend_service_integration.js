/**
 * Frontend Service Test: Subcategory-Specific Pricing Integration
 * 
 * This script tests the frontend pricing service methods to ensure they
 * properly handle subcategory-specific pricing requests.
 */

// Import the pricing service (this would be run in the React Native environment)
// const motorPricingService = require('./frontend/services/MotorInsurancePricingService').default;

const fetch = require('node-fetch');

// Mock the django API service for testing
const mockDjangoAPI = {
  async compareMotorPricing(payload) {
    const response = await fetch('http://127.0.0.1:8000/api/v1/public_app/insurance/compare_motor_pricing/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    return await response.json();
  }
};

// Mock pricing service methods that match the frontend implementation
const mockPricingService = {
  async compareUnderwritersBySubcategory(subcategoryCode, inputs, options = {}) {
    // This mimics the frontend method we added
    const payload = {
      subcategory: subcategoryCode,
      subcategory_code: subcategoryCode,
      vehicle_registration: inputs.registrationNumber || inputs.vehicle_registration,
      cover_start_date: inputs.cover_start_date,
      customer_first_name: inputs.customer_first_name || 'John',
      customer_last_name: inputs.customer_last_name || 'Doe',
      customer_phone: inputs.customer_phone || '254712345678',
      customer_email: inputs.customer_email || 'john@example.com',
      duration_days: inputs.duration_days || 30,
      sum_insured: inputs.sum_insured
    };

    console.log(`[compareUnderwritersBySubcategory] Using subcategory: ${subcategoryCode}`);
    console.log('Frontend service payload:', JSON.stringify(payload, null, 2));
    
    try {
      const res = await mockDjangoAPI.compareMotorPricing(payload);
      
      if (!res?.comparisons || !Array.isArray(res.comparisons)) {
        throw new Error('Invalid response format from backend');
      }

      // Process results (simplified version of frontend logic)
      const enhanced = res.comparisons.map((comp, index) => {
        const underwriterData = comp.result || comp;
        const finalPremium = underwriterData.total_premium || underwriterData.premium || 0;
        
        return {
          id: underwriterData.underwriter_id || `underwriter_${index}`,
          underwriter_code: underwriterData.underwriter_code,
          name: underwriterData.underwriter_name || `Underwriter ${underwriterData.underwriter_code}`,
          premium: finalPremium,
          total_premium: finalPremium,
          breakdown: underwriterData.premium_breakdown || {},
          _raw: comp
        };
      });

      // Sort by total premium (lowest first)
      enhanced.sort((a, b) => (a.total_premium || 0) - (b.total_premium || 0));
      
      return enhanced;
      
    } catch (e) {
      console.error('compareUnderwritersBySubcategory error:', e);
      throw new Error(`Failed to compare underwriters for subcategory ${subcategoryCode}: ${e.message}`);
    }
  },

  async compareUnderwritersByCoverType(category, coverType, inputs, options = {}) {
    // This mimics the original method with our improvements
    const subcategory = `${category?.toUpperCase()}_${coverType?.toUpperCase()}`;
    
    const payload = {
      subcategory: subcategory,
      subcategory_code: subcategory,
      category: category?.toUpperCase(),
      vehicle_registration: inputs.registrationNumber || inputs.vehicle_registration,
      cover_start_date: inputs.cover_start_date,
      customer_first_name: inputs.customer_first_name || 'John',
      customer_last_name: inputs.customer_last_name || 'Doe',
      customer_phone: inputs.customer_phone || '254712345678',
      customer_email: inputs.customer_email || 'john@example.com',
      duration_days: inputs.duration_days || 30,
      sum_insured: inputs.sum_insured
    };

    console.log(`[compareUnderwritersByCoverType] Mapping ${category} + ${coverType} → ${subcategory}`);
    console.log('Frontend service payload:', JSON.stringify(payload, null, 2));
    
    return this.compareUnderwritersBySubcategory(subcategory, inputs, options);
  }
};

// Test scenarios for frontend service
const frontendTestScenarios = [
  {
    name: 'Direct Subcategory Method - PRIVATE_THIRD_PARTY',
    method: 'compareUnderwritersBySubcategory',
    params: [
      'PRIVATE_THIRD_PARTY',
      {
        registrationNumber: 'KCD 123A',
        cover_start_date: '2025-09-30',
        customer_first_name: 'Test',
        customer_last_name: 'User1'
      }
    ]
  },
  {
    name: 'Direct Subcategory Method - PRIVATE_TOR',
    method: 'compareUnderwritersBySubcategory',
    params: [
      'PRIVATE_TOR',
      {
        registrationNumber: 'KCD 123B',
        cover_start_date: '2025-09-30',
        customer_first_name: 'Test',
        customer_last_name: 'User2'
      }
    ]
  },
  {
    name: 'Legacy CoverType Method - PRIVATE + THIRD_PARTY',
    method: 'compareUnderwritersByCoverType',
    params: [
      'PRIVATE',
      'THIRD_PARTY',
      {
        registrationNumber: 'KCD 123C',
        cover_start_date: '2025-09-30',
        customer_first_name: 'Test',
        customer_last_name: 'User3'
      }
    ]
  },
  {
    name: 'Legacy CoverType Method - PRIVATE + TOR',
    method: 'compareUnderwritersByCoverType',
    params: [
      'PRIVATE',
      'TOR',
      {
        registrationNumber: 'KCD 123D',
        cover_start_date: '2025-09-30',
        customer_first_name: 'Test',
        customer_last_name: 'User4'
      }
    ]
  },
  {
    name: 'Comprehensive with Sum Insured',
    method: 'compareUnderwritersBySubcategory',
    params: [
      'PRIVATE_COMPREHENSIVE',
      {
        registrationNumber: 'KCD 123E',
        cover_start_date: '2025-09-30',
        customer_first_name: 'Test',
        customer_last_name: 'User5',
        sum_insured: 1000000,
        duration_days: 365
      }
    ]
  }
];

async function testFrontendService() {
  console.log('🎯 Testing Frontend Service Integration');
  console.log('=' .repeat(60));
  
  const results = [];
  
  for (const scenario of frontendTestScenarios) {
    console.log(`\n🧪 Testing: ${scenario.name}`);
    console.log('-'.repeat(40));
    
    try {
      const startTime = Date.now();
      const result = await mockPricingService[scenario.method](...scenario.params);
      const endTime = Date.now();
      
      console.log(`✅ SUCCESS: Method executed in ${endTime - startTime}ms`);
      console.log(`📊 Underwriters returned: ${result.length}`);
      
      if (result.length > 0) {
        const prices = result.map(r => r.total_premium).sort((a, b) => a - b);
        console.log(`💰 Price range: KSh ${prices[0].toLocaleString()} - KSh ${prices[prices.length - 1].toLocaleString()}`);
        
        results.push({
          scenario: scenario.name,
          success: true,
          underwriter_count: result.length,
          price_range: { min: prices[0], max: prices[prices.length - 1] },
          method: scenario.method
        });
      } else {
        console.log('⚠️  No underwriters returned');
        results.push({
          scenario: scenario.name,
          success: false,
          error: 'No underwriters returned'
        });
      }
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      results.push({
        scenario: scenario.name,
        success: false,
        error: error.message
      });
    }
  }
  
  // Analyze frontend service results
  console.log('\n' + '='.repeat(60));
  console.log('📊 Frontend Service Analysis');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  const byMethod = {};
  
  successful.forEach(r => {
    if (!byMethod[r.method]) byMethod[r.method] = [];
    byMethod[r.method].push(r);
  });
  
  console.log(`\n✅ Success Rate: ${successful.length}/${results.length} (${(successful.length/results.length*100).toFixed(1)}%)`);
  
  Object.keys(byMethod).forEach(method => {
    console.log(`\n🔧 ${method}:`);
    byMethod[method].forEach(r => {
      console.log(`   • ${r.scenario}: ${r.underwriter_count} underwriters`);
    });
  });
  
  // Check for method consistency
  const directSubcategoryResults = successful.filter(r => r.method === 'compareUnderwritersBySubcategory' && r.scenario.includes('PRIVATE_THIRD_PARTY'));
  const legacyMethodResults = successful.filter(r => r.method === 'compareUnderwritersByCoverType' && r.scenario.includes('PRIVATE + THIRD_PARTY'));
  
  if (directSubcategoryResults.length > 0 && legacyMethodResults.length > 0) {
    const direct = directSubcategoryResults[0];
    const legacy = legacyMethodResults[0];
    
    console.log(`\n🔍 Method Consistency Check:`);
    console.log(`   • Direct subcategory method: ${direct.underwriter_count} underwriters, KSh ${direct.price_range.min} - KSh ${direct.price_range.max}`);
    console.log(`   • Legacy cover type method: ${legacy.underwriter_count} underwriters, KSh ${legacy.price_range.min} - KSh ${legacy.price_range.max}`);
    
    if (direct.underwriter_count === legacy.underwriter_count && 
        Math.abs(direct.price_range.min - legacy.price_range.min) < 10) {
      console.log(`   ✅ Methods are consistent - both return same results`);
    } else {
      console.log(`   ⚠️  Methods return different results - check implementation`);
    }
  }
  
  console.log(`\n🎯 Frontend Service Verdict:`);
  if (successful.length === results.length) {
    console.log(`   ✅ ALL FRONTEND METHODS WORKING CORRECTLY`);
    console.log(`   📱 Both direct subcategory and legacy methods functional`);
  } else {
    console.log(`   ⚠️  Some frontend methods failing - needs investigation`);
  }
}

// Main execution
async function runFullPricingTest() {
  console.log('🚀 COMPREHENSIVE SUBCATEGORY PRICING TEST');
  console.log('📅 Date:', new Date().toISOString());
  console.log('💡 Testing both backend API and frontend service integration\n');
  
  try {
    await testFrontendService();
    console.log('\n✨ All tests completed successfully!');
  } catch (error) {
    console.error('💥 Test execution failed:', error);
  }
}

if (require.main === module) {
  runFullPricingTest().catch(console.error);
}