// Test script to see the exact API call for TOR premium calculation
const { transformPricingRequest } = require('./frontend/utils/pricingCalculations');

// Simulate TOR form data
const mockTORData = {
  // From your logged selection
  subcategory_code: "PRIVATE_TOR",
  
  // From vehicle details form
  registrationNumber: "KCA123Z",
  financialInterest: "yes",
  identificationType: "registration",
  
  // Vehicle data
  vehicle_make: "Toyota",
  vehicle_model: "Corolla",
  vehicle_year: 2020,
  
  // Pricing form data
  cover_start_date: "2025-09-26"
};

const productType = "TOR";

console.log("=== TOR Premium Calculation API Call ===");
console.log("Product Type:", productType);
console.log("Raw Input Data:", JSON.stringify(mockTORData, null, 2));

const transformedPayload = transformPricingRequest(productType, mockTORData);
console.log("\nTransformed API Payload:", JSON.stringify(transformedPayload, null, 2));

// This is what gets sent to: /api/v1/public_app/insurance/calculate_motor_premium
console.log("\n=== Expected API Request ===");
console.log("POST /api/v1/public_app/insurance/calculate_motor_premium");
console.log("Content-Type: application/json");
console.log("Body:", JSON.stringify(transformedPayload, null, 2));