// Test Multiple Underwriter Pricing Comparison
import fetch from 'node-fetch';

const comparisonPayload = {
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
  "customer_email": "john.doe@email.com",
  // No need to specify underwriter_codes - API will auto-fetch all available underwriters
};

console.log("=== Testing Multiple Underwriter Pricing Comparison ===");
console.log("Payload:", JSON.stringify(comparisonPayload, null, 2));

async function testUnderwriterComparison() {
  try {
    // 1. Compare Multiple Underwriters
    const response = await fetch('http://127.0.0.1:8000/api/v1/public_app/insurance/compare_motor_pricing/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(comparisonPayload)
    });
    
    console.log("\n=== API Response Status ===");
    console.log("Status:", response.status);
    console.log("Status Text:", response.statusText);
    
    const result = await response.json();
    
    console.log("\n=== Multiple Underwriter Comparison Results ===");
    console.log("Total Underwriters Compared:", result.count);
    
    if (result.comparisons && result.comparisons.length > 0) {
      console.log("\n=== Premium Comparison by Underwriter ===");
      
      result.comparisons.forEach((comparison, index) => {
        const underwriter = comparison.underwriter_code;
        const pricing = comparison.result;
        
        console.log(`\n${index + 1}. ${underwriter} Underwriter:`);
        console.log(`   Base Premium: KSh ${pricing.premium_breakdown.base_premium}`);
        console.log(`   Training Levy: KSh ${pricing.premium_breakdown.training_levy}`);
        console.log(`   PCF Levy: KSh ${pricing.premium_breakdown.pcf_levy}`);
        console.log(`   Stamp Duty: KSh ${pricing.premium_breakdown.stamp_duty}`);
        console.log(`   TOTAL PREMIUM: KSh ${pricing.premium_breakdown.total_premium}`);
        console.log(`   Policy Period: ${pricing.policy_term.start_date} to ${pricing.policy_term.end_date}`);
      });
      
      // Find best and most expensive options
      const sortedByPrice = result.comparisons.sort((a, b) => 
        a.result.premium_breakdown.total_premium - b.result.premium_breakdown.total_premium
      );
      
      console.log("\n=== Price Analysis ===");
      console.log(`🏆 CHEAPEST: ${sortedByPrice[0].underwriter_code} - KSh ${sortedByPrice[0].result.premium_breakdown.total_premium}`);
      console.log(`💰 MOST EXPENSIVE: ${sortedByPrice[sortedByPrice.length - 1].underwriter_code} - KSh ${sortedByPrice[sortedByPrice.length - 1].result.premium_breakdown.total_premium}`);
      
      const priceDifference = sortedByPrice[sortedByPrice.length - 1].result.premium_breakdown.total_premium - sortedByPrice[0].result.premium_breakdown.total_premium;
      console.log(`📊 PRICE DIFFERENCE: KSh ${priceDifference}`);
    }
    
  } catch (error) {
    console.error("API Call Failed:", error.message);
  }
}

// Also test getting available underwriters
async function testAvailableUnderwriters() {
  try {
    console.log("\n=== Getting Available Underwriters ===");
    const response = await fetch('http://127.0.0.1:8000/api/v1/motor/underwriters/?category_code=PRIVATE', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const underwriters = await response.json();
    console.log("Available Underwriters:", underwriters);
    
  } catch (error) {
    console.error("Failed to get underwriters:", error.message);
  }
}

// Run both tests
async function runTests() {
  await testUnderwriterComparison();
  await testAvailableUnderwriters();
}

runTests();