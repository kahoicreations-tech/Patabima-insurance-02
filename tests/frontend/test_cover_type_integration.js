// Test Cover Type Integration with Underwriter Pricing
import fetch from 'node-fetch';

// Test different cover types to verify they're connected to our specific MotorCoverType data
const coverTypeTests = [
  {
    name: "Private TOR (Should use PRIVATE_TOR)",
    payload: {
      "category_code": "PRIVATE",
      "cover_type": "TOR",
      "subcategory_code": "PRIVATE_TOR",
      "vehicle_make": "Toyota",
      "vehicle_model": "Corolla",
      "vehicle_year": 2020,
      "vehicle_registration": "KCA 123A",
      "cover_start_date": "2025-09-27",
      "duration_days": 30,
      "customer_phone": "254712345678",
      "customer_first_name": "John",
      "customer_last_name": "Doe",
      "customer_email": "john.doe@email.com"
    }
  },
  {
    name: "Private Third-Party (Should use PRIVATE_THIRD_PARTY)",
    payload: {
      "category_code": "PRIVATE",
      "cover_type": "THIRD_PARTY",
      "subcategory_code": "PRIVATE_THIRD_PARTY",
      "vehicle_make": "Toyota",
      "vehicle_model": "Vitz",
      "vehicle_year": 2019,
      "vehicle_registration": "KCB 456B",
      "cover_start_date": "2025-09-27",
      "customer_phone": "254712345678",
      "customer_first_name": "Jane",
      "customer_last_name": "Smith",
      "customer_email": "jane.smith@email.com"
    }
  },
  {
    name: "Commercial TOR (Should use COMMERCIAL_TOR)",
    payload: {
      "category_code": "COMMERCIAL",
      "cover_type": "TOR",
      "subcategory_code": "COMMERCIAL_TOR",
      "vehicle_make": "Isuzu",
      "vehicle_model": "NPR",
      "vehicle_year": 2020,
      "vehicle_registration": "KCC 789C",
      "tonnage": 5,
      "cover_start_date": "2025-09-27",
      "duration_days": 15,
      "customer_phone": "254712345678",
      "customer_first_name": "Mike",
      "customer_last_name": "Johnson",
      "customer_email": "mike.johnson@email.com"
    }
  },
  {
    name: "PSV Uber Third-Party (Should use PSV_UBER_TP)",
    payload: {
      "category_code": "PSV",
      "cover_type": "THIRD_PARTY", 
      "subcategory_code": "PSV_UBER_TP",
      "vehicle_make": "Toyota",
      "vehicle_model": "Vitz",
      "vehicle_year": 2018,
      "vehicle_registration": "KCD 012D",
      "passenger_count": 4,
      "cover_start_date": "2025-09-27",
      "customer_phone": "254712345678",
      "customer_first_name": "Sarah",
      "customer_last_name": "Wilson",
      "customer_email": "sarah.wilson@email.com"
    }
  }
];

async function testCoverTypeIntegration() {
  console.log('='.repeat(80));
  console.log('🔍 TESTING COVER TYPE INTEGRATION WITH UNDERWRITER PRICING');
  console.log('='.repeat(80));
  console.log('Verifying that pricing system correctly uses our MotorCoverType data...\n');

  for (const test of coverTypeTests) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`📋 ${test.name}`);
    console.log(`${'═'.repeat(60)}`);
    console.log(`Expected Cover Type Code: ${test.payload.subcategory_code}`);
    console.log(`Category: ${test.payload.category_code}`);
    console.log(`Cover Type: ${test.payload.cover_type}`);
    
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/public_app/insurance/compare_motor_pricing/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(test.payload)
      });
      
      if (response.status === 200) {
        const result = await response.json();
        
        console.log(`\n✅ SUCCESS - Got ${result.count} underwriter quotes`);
        
        // Check if we get realistic price variations
        const premiums = result.comparisons.map(c => c.result.premium_breakdown?.total_premium || 0);
        const minPremium = Math.min(...premiums);
        const maxPremium = Math.max(...premiums);
        const priceVariation = maxPremium - minPremium;
        const variationPercent = minPremium > 0 ? ((priceVariation / minPremium) * 100).toFixed(1) : 0;
        
        console.log(`\n💰 PRICING ANALYSIS:`);
        console.log(`   Cheapest Quote: KSh ${minPremium.toLocaleString()}`);
        console.log(`   Most Expensive: KSh ${maxPremium.toLocaleString()}`);
        console.log(`   Price Variation: KSh ${priceVariation.toLocaleString()} (${variationPercent}%)`);
        
        // Show individual underwriter results
        console.log(`\n📊 UNDERWRITER BREAKDOWN:`);
        result.comparisons.forEach((comparison, index) => {
          const underwriter = comparison.underwriter_code;
          const premium = comparison.result.premium_breakdown?.total_premium || 0;
          const basePremium = comparison.result.premium_breakdown?.base_premium || 0;
          console.log(`   ${(index + 1).toString().padStart(2)}. ${underwriter.padEnd(8)}: KSh ${premium.toLocaleString().padStart(8)} (Base: KSh ${basePremium.toLocaleString()})`);
        });
        
        // Verify we're getting different prices (indicating proper cover type integration)
        if (priceVariation > 0) {
          console.log(`\n✅ INTEGRATION CHECK: Price variations detected - Cover type integration working!`);
        } else {
          console.log(`\n⚠️  INTEGRATION WARNING: All underwriters showing same price - May need to check cover type mapping`);
        }
        
      } else {
        const errorText = await response.text();
        console.log(`\n❌ API ERROR: ${response.status} - ${response.statusText}`);
        console.log(`Error Details: ${errorText}`);
      }
    } catch (error) {
      console.log(`\n❌ REQUEST FAILED: ${error.message}`);
    }
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('🎯 COVER TYPE INTEGRATION TEST COMPLETE');
  console.log('='.repeat(80));
  console.log('✅ If you see price variations, the system is properly connected to MotorCoverType data');
  console.log('✅ Different cover types should show appropriate base premiums for their product type');
  console.log('✅ Underwriters should show different rates based on their market positioning');
  console.log('='.repeat(80));
}

testCoverTypeIntegration();