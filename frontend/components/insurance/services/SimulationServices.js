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
          policyNumber: 'CH343/2023',
          issuer: 'CIC Insurance',
          expiryDate: '2026-04-13',
          coverType: 'Comprehensive',
          status: 'Active'
        },
        recommendation: {
          suggestedStartDate: '2026-04-14',
          message: 'Vehicle has existing cover. New policy will start after current expiry.'
        }
      },
      'KCA 234H': {
        hasExistingPolicy: false,
        recommendation: {
          suggestedStartDate: new Date().toISOString().split('T')[0],
          message: 'No existing policy found. Cover can start immediately.'
        }
      },
      'KBZ 789X': {
        hasExistingPolicy: true,
        currentPolicy: {
          policyNumber: 'APA/2024/0012',
          issuer: 'APA Insurance',
          expiryDate: '2025-12-15',
          coverType: 'Third Party',
          status: 'Active'
        },
        recommendation: {
          suggestedStartDate: '2025-12-16',
          message: 'Existing Third Party cover found. Consider upgrading to Comprehensive.'
        }
      }
    };

    const result = mockPolicies[vehicleRegistration.toUpperCase()] || {
      hasExistingPolicy: false,
      recommendation: {
        suggestedStartDate: new Date().toISOString().split('T')[0],
        message: 'No existing policy found. Cover can start immediately.'
      }
    };

    console.log('DMVIC Check Result:', result);
    return result;
  },

  // Simulate getting vehicle details from registration
  getVehicleDetails: async (vehicleRegistration) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockVehicleData = {
      'KDN 423A': {
        make: 'Toyota',
        model: 'Corolla',
        year: 2019,
        engineSize: '1500cc',
        color: 'White',
        ownerName: 'John Doe',
        chassisNumber: 'NCXSK-000950'
      },
      'KCA 234H': {
        make: 'Nissan',
        model: 'X-Trail',
        year: 2020,
        engineSize: '2000cc',
        color: 'Silver',
        ownerName: 'Jane Smith',
        chassisNumber: 'NISSAN-XTR2020'
      }
    };

    return mockVehicleData[vehicleRegistration.toUpperCase()] || null;
  }
};

// AWS Textract Service Simulation
export const TextractService = {
  // Simulate extracting data from uploaded documents
  extractDocumentData: async (documentType, imageBase64) => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Processing document:', documentType);
    
    // Mock extracted data based on document type
    const mockExtractions = {
      logbook: {
        confidence: 95.8,
        extractedData: {
          vehicleRegistration: 'KDN 423A',
          make: 'TOYOTA',
          model: 'COROLLA',
          year: '2019',
          engineNumber: 'TOY-ENG-2019-001',
          chassisNumber: 'NCXSK-000950',
          ownerName: 'JOHN DOE',
          ownerIdNumber: 'A09900030003',
          dateOfFirstRegistration: '2019-03-15'
        },
        extractedFields: [
          { field: 'vehicleRegistration', value: 'KDN 423A', confidence: 98.2 },
          { field: 'make', value: 'TOYOTA', confidence: 97.5 },
          { field: 'model', value: 'COROLLA', confidence: 96.8 },
          { field: 'ownerName', value: 'JOHN DOE', confidence: 94.3 }
        ]
      },
      nationalId: {
        confidence: 97.2,
        extractedData: {
          idNumber: 'A09900030003',
          firstName: 'JOHN',
          lastName: 'DOE',
          dateOfBirth: '1990-05-15',
          placeOfBirth: 'NAIROBI',
          dateOfIssue: '2020-01-10'
        },
        extractedFields: [
          { field: 'idNumber', value: 'A09900030003', confidence: 99.1 },
          { field: 'firstName', value: 'JOHN', confidence: 96.8 },
          { field: 'lastName', value: 'DOE', confidence: 96.5 }
        ]
      },
      kraPin: {
        confidence: 92.5,
        extractedData: {
          pinNumber: 'A009900030003',
          taxpayerName: 'JOHN DOE',
          registrationDate: '2018-06-20',
          status: 'ACTIVE'
        }
      }
    };

    const result = mockExtractions[documentType] || {
      confidence: 0,
      error: 'Document type not supported or extraction failed'
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