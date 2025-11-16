// Test frontend pricing service
import MotorInsurancePricingService from './frontend/services/MotorInsurancePricingService.js';

const testFrontendPricing = async () => {
  console.log('=== Testing Frontend Pricing Service ===');
  
  const service = new MotorInsurancePricingService();
  
  const testInputs = {
    subcategory_code: 'PRIVATE_TOR',
    vehicle_make: 'Toyota',
    vehicle_model: 'Corolla',
    vehicle_year: 2020,
    registrationNumber: 'KCA 123A',
    cover_start_date: '2025-09-27'
  };
  
  try {
    console.log('Calling compareUnderwritersByCoverType...');
    const results = await service.compareUnderwritersByCoverType('PRIVATE', 'TOR', testInputs);
    
    console.log('\n=== Frontend Service Results ===');
    console.log(`Total results: ${results.length}`);
    
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.name}:`);
      console.log(`   Total Premium: KSh ${result.total_premium}`);
      console.log(`   Market Position: ${result.market_position || 'N/A'}`);
      console.log(`   Rating: ${result.rating}★`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testFrontendPricing();