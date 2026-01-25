/**
 * Backend Simulation Services
 * 
 * Simulates DMVIC, AWS Textract, and other backend services
 */

// DMVIC Service Simulation
export const DMVICService = {
  // Simulate checking existing policy for a vehicle
  checkExistingPolicy: async (vehicleRegistration) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock data - some vehicles have existing policies
    const mockPolicies = {
      'KDN 423A': {
        hasExistingPolicy: true,
        currentPolicy: {
          /**
           * Compatibility shim: SimulationServices has been retired.
           *
           * The app now uses real backend integrations via EnhancedServices.
           * This export is kept only to avoid breaking legacy imports.
           */

          import EnhancedServices from './EnhancedServices';

          export const SimulationServices = EnhancedServices;

    };

    console.log('Textract Extraction Result:', result);
    return result;
  },

  // Simulate validating extracted data against user inputs
  validateExtractedData: async (extractedData, userInputs) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const validations = [];
    
    // Check vehicle registration match
    if (extractedData.vehicleRegistration && userInputs.vehicle_registration) {
      const match = extractedData.vehicleRegistration.toUpperCase() === 
                   userInputs.vehicle_registration.toUpperCase();
      validations.push({
        field: 'vehicle_registration',
        status: match ? 'match' : 'mismatch',
        extracted: extractedData.vehicleRegistration,
        input: userInputs.vehicle_registration,
        confidence: match ? 95 : 20
      });
    }

    // Check vehicle make match
    if (extractedData.make && userInputs.vehicle_make) {
      const match = extractedData.make.toUpperCase() === 
                   userInputs.vehicle_make.toUpperCase();
      validations.push({
        field: 'vehicle_make',
        status: match ? 'match' : 'mismatch',
        extracted: extractedData.make,
        input: userInputs.vehicle_make,
        confidence: match ? 90 : 15
      });
    }

    // Check owner name match
    if (extractedData.ownerName && userInputs.owner_name) {
      const similarity = calculateSimilarity(
        extractedData.ownerName.toUpperCase(), 
        userInputs.owner_name.toUpperCase()
      );
      validations.push({
        field: 'owner_name',
        status: similarity > 80 ? 'match' : 'partial_match',
        extracted: extractedData.ownerName,
        input: userInputs.owner_name,
        confidence: similarity
      });
    }

    console.log('Validation Results:', validations);
    return {
      overallMatch: validations.filter(v => v.status === 'match').length / validations.length * 100,
      validations,
      recommendation: validations.some(v => v.status === 'mismatch') 
        ? 'Manual review required' 
        : 'Auto-approved'
    };
  }
};

// Underwriter Service Simulation
export const UnderwriterService = {
  // Simulate getting real-time pricing
  calculatePremium: async (formData, productType) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock pricing logic based on product type and vehicle details
    const basePricing = {
      'TOR_PRIVATE': { basePremium: 5000, levyRate: 0.002, stampDuty: 40 },
      'TOR_COMMERCIAL': { basePremium: 8000, levyRate: 0.002, stampDuty: 40 },
      'COMPREHENSIVE_PRIVATE': { basePremium: 25000, levyRate: 0.002, stampDuty: 40 },
      'THIRD_PARTY_PRIVATE': { basePremium: 3500, levyRate: 0.002, stampDuty: 40 }
    };

    const pricing = basePricing[productType] || basePricing['TOR_PRIVATE'];
    
    // Adjust pricing based on vehicle details
    let adjustedPremium = pricing.basePremium;
    
    if (formData.vehicle_make === 'Mercedes-Benz' || formData.vehicle_make === 'BMW') {
      adjustedPremium *= 1.5; // Luxury car premium
    }
    
    if (formData.vehicle_year && formData.vehicle_year < 2015) {
      adjustedPremium *= 1.2; // Older vehicle premium
    }

    const trainingLevy = Math.round(adjustedPremium * pricing.levyRate);
    const total = adjustedPremium + trainingLevy + pricing.stampDuty;

    const result = {
      basePremium: adjustedPremium,
      trainingLevy,
      stampDuty: pricing.stampDuty,
      total,
      breakdown: [
        { label: 'Base Premium', amount: adjustedPremium },
        { label: 'Training Levy (0.2%)', amount: trainingLevy },
        { label: 'Stamp Duty', amount: pricing.stampDuty }
      ],
      lastUpdated: new Date().toISOString()
    };

    console.log('Premium Calculation:', result);
    return result;
  }
};

// Helper function for name similarity
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 100;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return Math.round(((longer.length - editDistance) / longer.length) * 100);
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}