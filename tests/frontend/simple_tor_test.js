// Test script to demonstrate TOR API payload transformation

// Sample TOR form data (from DynamicPricingForm)
const torFormData = {
  vehicleData: {
    vehicle_make: "Toyota",
    vehicle_model: "Corolla",
    vehicle_year: 2020,
    vehicle_registration: "KCA 123A",
    vehicle_value: 1500000,
    customer_phone: "254712345678",
    customer_first_name: "John",
    customer_last_name: "Doe",
    customer_email: "john.doe@email.com"
  },
  pricingData: {
    coverage_start_date: "2025-09-26",
    sum_insured: 1500000
  },
  coverage: {
    subcategory_code: "PRIVATE_TOR",
    category: "private",
    name: "TOR"
  }
};

// Simplified version of transformPricingRequest function
function transformPricingRequest(vehicleData, pricingData, coverage) {
  return {
    subcategory_code: coverage.subcategory_code,
    vehicle_make: vehicleData.vehicle_make,
    vehicle_model: vehicleData.vehicle_model,
    vehicle_year: vehicleData.vehicle_year,
    vehicle_registration: vehicleData.vehicle_registration,
    vehicle_value: vehicleData.vehicle_value,
    sum_insured: pricingData.sum_insured,
    cover_start_date: pricingData.coverage_start_date,
    customer_phone: vehicleData.customer_phone,
    customer_first_name: vehicleData.customer_first_name,
    customer_last_name: vehicleData.customer_last_name,
    customer_email: vehicleData.customer_email
  };
}

console.log("=== TOR Form Data ===");
console.log(JSON.stringify(torFormData, null, 2));

console.log("\n=== Transforming to API Payload ===");
const apiPayload = transformPricingRequest(torFormData.vehicleData, torFormData.pricingData, torFormData.coverage);

console.log("=== Final API Payload ===");
console.log(JSON.stringify(apiPayload, null, 2));

console.log("\n=== API Endpoint ===");
console.log("POST /api/v1/public_app/insurance/calculate_motor_premium");
console.log("Content-Type: application/json");
console.log("Authorization: Bearer <token>");

console.log("\n=== Expected Response Structure ===");
console.log(JSON.stringify({
  "success": true,
  "data": {
    "base_premium": "number",
    "itl_levy": "number (0.25% of base premium)",
    "pcf_levy": "number (0.25% of base premium)", 
    "stamp_duty": "40 (fixed KSh 40)",
    "total_premium": "number (base + levies)",
    "underwriter": "string",
    "policy_details": "object"
  }
}, null, 2));