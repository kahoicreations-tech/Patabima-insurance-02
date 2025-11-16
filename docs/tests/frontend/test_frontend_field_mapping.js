// Test the improved field mapping with actual backend API to verify varied pricing
const fetch = require('node-fetch');

// Copy the updated transformPricingRequest function from frontend
function transformPricingRequest(productType, inputs) {
  // ESSENTIAL FIELDS FOR UNDERWRITER PRICE FETCHING
  // Backend needs these core fields to fetch underwriter prices: category, subcategory_code, cover_type
  const base = {
    category: inputs.category || inputs.category_code,
    subcategory_code: inputs.subcategory_code,
    cover_type: productType,
    underwriter_code: inputs.underwriter_code,
  };

  // Vehicle registration - essential for TOR and Third Party
  if (inputs.registrationNumber) base.vehicle_registration = inputs.registrationNumber;
  if (inputs.vehicle_registration) base.vehicle_registration = inputs.vehicle_registration;

  // Cover start date and policy term mapping - essential for all products
  if (inputs.cover_start_date) base.cover_start_date = inputs.cover_start_date;

  // PRICING CALCULATION FIELDS - mainly for Comprehensive products
  // Only include these if the product type requires pricing calculations
  const requiresPricingCalculation = productType && (
    productType.toUpperCase().includes('COMPREHENSIVE') || 
    productType.toUpperCase().includes('COMP') ||
    inputs.sum_insured // If sum_insured is provided, it's likely comprehensive
  );

  if (requiresPricingCalculation) {
    // Comprehensive-specific fields for pricing calculations
    if (inputs.vehicle_year) base.vehicle_age = Math.max(0, (new Date()).getFullYear() - parseInt(inputs.vehicle_year));
    if (inputs.sum_insured != null) base.sum_insured = Number(inputs.sum_insured);
    if (inputs.tonnage != null) base.tonnage = Number(inputs.tonnage);
    if (inputs.passengers != null) base.passenger_count = Number(inputs.passengers);

    // Additional add-ons can be grouped
    const add_ons = {};
    if (inputs.excess_protector != null) add_ons.excess_protector = !!inputs.excess_protector;
    if (inputs.pvt != null) add_ons.pvt = !!inputs.pvt;
    if (inputs.cover_days != null) add_ons.cover_days = Number(inputs.cover_days);
    if (Object.keys(add_ons).length) base.add_ons = add_ons;

    // Preserve some legacy fields for compatibility with older endpoints if they are used elsewhere
    if (inputs.vehicle_make) base.vehicle_make = inputs.vehicle_make;
    if (inputs.vehicle_model) base.vehicle_model = inputs.vehicle_model;
    if (inputs.vehicle_year) base.vehicle_year = parseInt(inputs.vehicle_year);
  } else {
    // For TOR and Third Party - minimal fields needed
    // Still include vehicle_year if available as it might be used for age restrictions
    if (inputs.vehicle_year) base.vehicle_year = parseInt(inputs.vehicle_year);
  }

  // Map form field names to backend expected field names
  
  // Customer information mapping - extract from various possible field formats
  // Handle full name or split first/last name
  if (inputs.fullName) {
    const nameParts = inputs.fullName.trim().split(/\s+/);
    base.customer_first_name = nameParts[0] || 'John';
    base.customer_last_name = nameParts.slice(1).join(' ') || 'Doe';
  } else if (inputs.ownerName) {
    const nameParts = inputs.ownerName.trim().split(/\s+/);
    base.customer_first_name = nameParts[0] || 'John';
    base.customer_last_name = nameParts.slice(1).join(' ') || 'Doe';
  } else {
    // Provide default customer details if not available (for testing)
    base.customer_first_name = 'John';
    base.customer_last_name = 'Doe';
  }
  
  // Phone number mapping
  if (inputs.phoneNumber) {
    base.customer_phone = inputs.phoneNumber;
  } else if (inputs.ownerPhone) {
    base.customer_phone = inputs.ownerPhone;
  } else {
    base.customer_phone = '254712345678'; // Default for testing
  }
  
  // Email mapping  
  if (inputs.email) {
    base.customer_email = inputs.email;
  } else if (inputs.emailAddress) {
    base.customer_email = inputs.emailAddress;
  } else if (inputs.ownerEmail) {
    base.customer_email = inputs.ownerEmail;
  } else {
    base.customer_email = 'john.doe@email.com'; // Default for testing
  }

  // Duration mapping - critical for pricing calculations
  if (typeof inputs.duration_days === 'number') {
    base.duration_days = inputs.duration_days;
  } else if (inputs.policy_term_months) {
    // Convert months to days (approximate)
    base.duration_days = Number(inputs.policy_term_months) * 30;
  } else {
    // Default to 30 days for TOR products (common test case)
    base.duration_days = 30;
  }
  
  // Accept either months numeric or human-readable '12 months'
  const cp = inputs.coveragePeriod || inputs.policy_term_label;
  if (typeof inputs.policy_term_months === 'number') {
    base.policy_term_months = inputs.policy_term_months;
  } else if (cp && typeof cp === 'string') {
    const m = cp.match(/(\d+)\s*month/i);
    if (m) base.policy_term_months = parseInt(m[1]);
  }
  
  if (inputs.category || inputs.category_code) base.category = inputs.category || inputs.category_code;

  return base;
}

async function testUpdatedFieldMapping() {
  // Simulate form data that would come from DynamicVehicleForm
  const formInputs = {
    registrationNumber: "KCA 123A",
    cover_start_date: "2025-09-27",
    subcategory_code: "TOR",
    category: "PRIVATE",
    vehicle_year: 2020,
    fullName: "John Doe",
    phoneNumber: "254712345678",
    email: "john.doe@email.com",
    financialInterest: "Yes",
    identificationType: "Vehicle Registration"
  };

  console.log("=== Testing Updated Field Mapping with Backend API ===");
  console.log("Form inputs (simulating DynamicVehicleForm):");
  console.log(JSON.stringify(formInputs, null, 2));

  // Transform using our updated function
  const mappedPayload = transformPricingRequest("TOR", formInputs);
  
  console.log("\nMapped payload (sent to backend):");
  console.log(JSON.stringify(mappedPayload, null, 2));

  try {
    console.log("\nCalling backend API...");
    
    const response = await fetch('http://127.0.0.1:8000/api/v1/public_app/insurance/compare_motor_pricing/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mappedPayload)
    });

    const result = await response.json();
    
    console.log("\n=== BACKEND RESPONSE ===");
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(result, null, 2));

    if (result.comparisons && Array.isArray(result.comparisons)) {
      console.log("\n=== UNDERWRITER PRICING ANALYSIS ===");
      console.log(`Found ${result.comparisons.length} underwriters:`);
      
      result.comparisons.forEach((comp, index) => {
        const pricing = comp.pricing || comp.result || comp;
        const totalPremium = pricing.total_premium || pricing.premium || 0;
        console.log(`${index + 1}. ${comp.underwriter_name}: KSh ${totalPremium.toLocaleString()}`);
      });

      // Check for pricing variation
      const prices = result.comparisons.map(comp => {
        const pricing = comp.pricing || comp.result || comp;
        return Number(pricing.total_premium || pricing.premium || 0);
      });
      
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceRange = maxPrice - minPrice;
      
      console.log(`\nPrice range: KSh ${minPrice.toLocaleString()} - KSh ${maxPrice.toLocaleString()}`);
      console.log(`Price variation: KSh ${priceRange.toLocaleString()}`);
      
      if (priceRange > 0) {
        console.log("✅ SUCCESS: Backend returns varied pricing! Field mapping is working correctly.");
      } else {
        console.log("❌ ISSUE: All underwriters still show the same price.");
      }
    } else {
      console.log("❌ ERROR: Invalid response format or no comparisons returned");
    }

  } catch (error) {
    console.error("❌ API Error:", error.message);
  }
}

// Run the test
testUpdatedFieldMapping();