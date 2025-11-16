// Test actual TOR API call
import fetch from 'node-fetch';

const torApiPayload = {
  "category_code": "PRIVATE",
  "cover_type": "TOR",
  "subcategory_code": "PRIVATE_TOR",
  "vehicle_make": "Toyota",
  "vehicle_model": "Corolla", 
  "vehicle_year": 2020,
  "vehicle_registration": "KCA 123A",
  // Note: TOR is third-party insurance - no vehicle_value or sum_insured needed
  "cover_start_date": "2025-09-27",
  "duration_days": 30,
  "customer_phone": "254712345678",
  "customer_first_name": "John",
  "customer_last_name": "Doe",
  "customer_email": "john.doe@email.com"
};

console.log("=== Testing TOR Premium Calculation API ===");
console.log("Payload:", JSON.stringify(torApiPayload, null, 2));

async function testTORAPI() {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/v1/public_app/insurance/calculate_motor_premium/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(torApiPayload)
    });
    
    console.log("\n=== API Response Status ===");
    console.log("Status:", response.status);
    console.log("Status Text:", response.statusText);
    
    const result = await response.json();
    
    console.log("\n=== API Response Body ===");
    console.log(JSON.stringify(result, null, 2));
    
    if (result.premium_breakdown) {
      console.log("\n=== Premium Breakdown Analysis ===");
      console.log("Base Premium: KSh", result.premium_breakdown.base_premium);
      console.log("Training Levy (0.25%): KSh", result.premium_breakdown.training_levy);
      console.log("PCF Levy (0.25%): KSh", result.premium_breakdown.pcf_levy);
      console.log("Stamp Duty: KSh", result.premium_breakdown.stamp_duty);
      console.log("Total Premium: KSh", result.premium_breakdown.total_premium);
      
      // Verify calculations
      const expectedBase = 1500; // 30 days TOR for private: 1500 * 30/30 = 1500
      const expectedTrainingLevy = Math.round(expectedBase * 0.0025 * 100) / 100;
      const expectedPCFLevy = Math.round(expectedBase * 0.0025 * 100) / 100;
      const expectedStampDuty = 40;
      const expectedTotal = expectedBase + expectedTrainingLevy + expectedPCFLevy + expectedStampDuty;
      
      console.log("\n=== Calculation Verification ===");
      console.log("Expected Base Premium (30 days TOR): KSh", expectedBase);
      console.log("Expected Training Levy: KSh", expectedTrainingLevy);
      console.log("Expected PCF Levy: KSh", expectedPCFLevy);
      console.log("Expected Stamp Duty: KSh", expectedStampDuty);
      console.log("Expected Total: KSh", expectedTotal);
    }
    
  } catch (error) {
    console.error("API Call Failed:", error.message);
  }
}

testTORAPI();