// Test the frontend workaround for extracting correct underwriter-specific pricing
const fetch = require('node-fetch');

// Copy the updated functions with workaround
function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function toMoney(n) {
  return round2(n || 0);
}

function normalizePricingResponse(resp) {
  // Accepts various backend shapes and normalizes to { premium, breakdown, meta }
  if (!resp) return { premium: 0, breakdown: {}, meta: {} };
  
  // Handle different response structures from backend
  let totalPremium = Number(resp.total_premium || resp.premium || resp.base_premium || 0);
  let basePremium = Number(resp.base_premium || 0);
  
  // WORKAROUND: If backend premium_breakdown has incorrect base_premium,
  // try to extract correct base premium from features pricing section
  if (resp.features && resp.features.pricing && resp.category && resp.cover_type) {
    const pricingKey = `${resp.category}_${resp.cover_type}`;
    const underwriterPricing = resp.features.pricing[pricingKey];
    if (underwriterPricing && underwriterPricing.base_premium) {
      basePremium = Number(underwriterPricing.base_premium);
      console.log(`Using underwriter-specific base premium from features: ${basePremium} for ${resp.underwriter_name}`);
    }
  }
  
  // Recalculate total premium with correct base premium if needed
  if (resp.premium_breakdown && basePremium !== Number(resp.premium_breakdown.base_premium)) {
    const trainingLevy = Number(resp.premium_breakdown.training_levy || basePremium * 0.0025);
    const pcfLevy = Number(resp.premium_breakdown.pcf_levy || basePremium * 0.0025);
    const stampDuty = Number(resp.premium_breakdown.stamp_duty || 40);
    totalPremium = basePremium + trainingLevy + pcfLevy + stampDuty;
    console.log(`Recalculated total premium for ${resp.underwriter_name}: ${totalPremium} (base: ${basePremium})`);
  }
  
  // If the backend provides breakdown structure (like from test results)
  if (resp.base_premium && resp.training_levy && resp.pcf_levy && resp.stamp_duty) {
    totalPremium = Number(resp.base_premium) + Number(resp.training_levy) + Number(resp.pcf_levy) + Number(resp.stamp_duty);
  }
  
  const breakdown = resp.breakdown || resp.premium_breakdown || {
    base: basePremium,
    training_levy: Number(resp.training_levy || 0),
    pcf_levy: Number(resp.pcf_levy || 0),
    stamp_duty: Number(resp.stamp_duty || 0)
  };
  
  const meta = resp.meta || {};
  
  return { 
    premium: toMoney(totalPremium), 
    totalPremium: toMoney(totalPremium),
    breakdown, 
    meta,
    // Include individual components if available
    base_premium: basePremium,
    training_levy: Number(resp.training_levy || 0),
    pcf_levy: Number(resp.pcf_levy || 0),
    stamp_duty: Number(resp.stamp_duty || 0)
  };
}

async function testFrontendWorkaround() {
  const payload = {
    "category": "PRIVATE",
    "subcategory_code": "TOR",
    "cover_type": "TOR",
    "vehicle_registration": "KCA 123A",
    "cover_start_date": "2025-09-27",
    "vehicle_year": 2020,
    "customer_first_name": "John",
    "customer_last_name": "Doe",
    "customer_phone": "254712345678",
    "customer_email": "john.doe@email.com",
    "duration_days": 30
  };

  console.log("=== Testing Frontend Workaround for Correct Pricing ===");

  try {
    const response = await fetch('http://127.0.0.1:8000/api/v1/public_app/insurance/compare_motor_pricing/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    console.log("\n=== PROCESSING WITH FRONTEND WORKAROUND ===");
    
    if (result.comparisons && Array.isArray(result.comparisons)) {
      console.log(`Processing ${result.comparisons.length} underwriter comparisons...\n`);
      
      const processedComparisons = result.comparisons.map((comp) => {
        const normalizedPricing = normalizePricingResponse(comp.result);
        return {
          name: comp.result.underwriter_name,
          code: comp.result.underwriter_code,
          market_position: comp.result.market_position,
          original_total: comp.result.premium_breakdown.total_premium,
          corrected_total: normalizedPricing.totalPremium,
          base_premium: normalizedPricing.base_premium
        };
      });

      console.log("=== COMPARISON RESULTS ===");
      processedComparisons.forEach((comp, index) => {
        console.log(`${index + 1}. ${comp.name} (${comp.market_position}):`);
        console.log(`   Base Premium: KSh ${comp.base_premium.toLocaleString()}`);
        console.log(`   Original Total: KSh ${comp.original_total.toLocaleString()}`);
        console.log(`   Corrected Total: KSh ${comp.corrected_total.toLocaleString()}`);
        console.log('');
      });

      // Check for pricing variation in corrected prices
      const correctedPrices = processedComparisons.map(comp => comp.corrected_total);
      const minPrice = Math.min(...correctedPrices);
      const maxPrice = Math.max(...correctedPrices);
      const priceRange = maxPrice - minPrice;
      
      console.log(`Corrected Price Range: KSh ${minPrice.toLocaleString()} - KSh ${maxPrice.toLocaleString()}`);
      console.log(`Price Variation: KSh ${priceRange.toLocaleString()}`);
      
      if (priceRange > 0) {
        console.log("\n✅ SUCCESS: Frontend workaround successfully extracts varied pricing!");
        
        // Find cheapest and most expensive
        const cheapest = processedComparisons.find(comp => comp.corrected_total === minPrice);
        const mostExpensive = processedComparisons.find(comp => comp.corrected_total === maxPrice);
        
        console.log(`💰 Cheapest: ${cheapest.name} - KSh ${cheapest.corrected_total.toLocaleString()}`);
        console.log(`💎 Most Expensive: ${mostExpensive.name} - KSh ${mostExpensive.corrected_total.toLocaleString()}`);
      } else {
        console.log("\n❌ Even with workaround, all prices are still the same");
      }
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testFrontendWorkaround();