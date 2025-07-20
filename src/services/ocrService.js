/**
 * OCR Service for Document Processing
 * Supports multiple OCR providers for maximum accuracy
 */

// OCR Service Configuration
const OCR_CONFIG = {
  // Google Cloud Vision API
  googleVision: {
    enabled: true,
    apiKey: process.env.GOOGLE_VISION_API_KEY || 'YOUR_API_KEY_HERE',
    endpoint: 'https://vision.googleapis.com/v1/images:annotate'
  },
  
  // AWS Textract
  awsTextract: {
    enabled: true,
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  
  // Microsoft Azure Computer Vision
  azureVision: {
    enabled: true,
    apiKey: process.env.AZURE_VISION_KEY,
    endpoint: process.env.AZURE_VISION_ENDPOINT
  }
};

/**
 * Kenyan Document Patterns for OCR Validation
 */
const KENYAN_DOCUMENT_PATTERNS = {
  nationalId: {
    idNumber: /\b\d{8}\b/,
    names: /([A-Z][A-Z\s]{2,50})/g,
    dateOfBirth: /\b\d{2}[\/\-]\d{2}[\/\-]\d{4}\b/
  },
  
  kraPin: {
    pin: /\bA\d{9}[A-Z]\b/,
    taxpayerName: /TAXPAYER[:\s]+([A-Z\s]+)/i,
    status: /(ACTIVE|INACTIVE|SUSPENDED)/i
  },
  
  vehicleLogbook: {
    registration: /\b[A-Z]{2,3}[\s\-]?\d{2,4}[A-Z]?\b/,
    make: /(TOYOTA|NISSAN|HONDA|MAZDA|SUBARU|MITSUBISHI|BMW|MERCEDES|AUDI|VOLKSWAGEN)/i,
    model: /(COROLLA|VITZ|FIELDER|PRADO|HILUX|NOTE|TIIDA|X-TRAIL|FIT|VEZEL|FORESTER|IMPREZA)/i,
    year: /\b(19|20)\d{2}\b/,
    engineCapacity: /\b(\d{3,4})\s?CC\b/i,
    chassisNumber: /[A-Z0-9]{17}/
  },
  
  drivingLicense: {
    licenseNumber: /\b[A-Z]{2}\d{7}\b/,
    holderName: /HOLDER[:\s]+([A-Z\s]+)/i,
    expiryDate: /EXPIRY[:\s]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i,
    class: /CLASS[:\s]+([A-Z0-9]+)/i
  }
};

/**
 * Main OCR Processing Function
 */
export const processDocumentWithOCR = async (imageData, documentType) => {
  try {
    console.log(`Starting OCR processing for ${documentType.type}`);
    
    // Try multiple OCR services in order of preference
    const ocrServices = [
      { name: 'googleVision', processor: processWithGoogleVision },
      { name: 'azureVision', processor: processWithAzureVision },
      { name: 'awsTextract', processor: processWithAWSTextract }
    ];
    
    let extractedData = null;
    let lastError = null;
    
    for (const service of ocrServices) {
      if (OCR_CONFIG[service.name]?.enabled) {
        try {
          console.log(`Trying OCR with ${service.name}`);
          extractedData = await service.processor(imageData, documentType);
          
          if (extractedData && Object.keys(extractedData).length > 0) {
            console.log(`OCR successful with ${service.name}:`, extractedData);
            return {
              success: true,
              data: extractedData,
              service: service.name,
              confidence: calculateConfidence(extractedData, documentType)
            };
          }
        } catch (error) {
          console.warn(`OCR failed with ${service.name}:`, error.message);
          lastError = error;
        }
      }
    }
    
    // If all services fail, try pattern-based extraction
    try {
      console.log('Falling back to pattern-based extraction');
      extractedData = await extractWithPatterns(imageData, documentType);
      
      if (extractedData && Object.keys(extractedData).length > 0) {
        return {
          success: true,
          data: extractedData,
          service: 'pattern-matching',
          confidence: 0.6
        };
      }
    } catch (error) {
      lastError = error;
    }
    
    return {
      success: false,
      error: lastError?.message || 'All OCR services failed',
      service: null
    };
    
  } catch (error) {
    console.error('OCR processing error:', error);
    return {
      success: false,
      error: error.message,
      service: null
    };
  }
};

/**
 * Google Cloud Vision API Processing
 */
const processWithGoogleVision = async (imageData, documentType) => {
  const { apiKey, endpoint } = OCR_CONFIG.googleVision;
  
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    throw new Error('Google Vision API key not configured');
  }
  
  const requestBody = {
    requests: [
      {
        image: {
          content: imageData.base64
        },
        features: [
          { type: 'TEXT_DETECTION', maxResults: 1 },
          { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }
        ]
      }
    ]
  };
  
  const response = await fetch(`${endpoint}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    throw new Error(`Google Vision API error: ${response.status}`);
  }
  
  const result = await response.json();
  
  if (result.responses?.[0]?.textAnnotations) {
    const detectedText = result.responses[0].textAnnotations[0].description;
    return parseKenyanDocument(detectedText, documentType);
  }
  
  throw new Error('No text detected by Google Vision');
};

/**
 * Azure Computer Vision Processing
 */
const processWithAzureVision = async (imageData, documentType) => {
  const { apiKey, endpoint } = OCR_CONFIG.azureVision;
  
  if (!apiKey || !endpoint) {
    throw new Error('Azure Vision API credentials not configured');
  }
  
  const response = await fetch(`${endpoint}/vision/v3.2/ocr`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: imageData.uri // For Azure, we might need to upload to blob storage first
    })
  });
  
  if (!response.ok) {
    throw new Error(`Azure Vision API error: ${response.status}`);
  }
  
  const result = await response.json();
  
  if (result.regions) {
    const detectedText = extractTextFromAzureRegions(result.regions);
    return parseKenyanDocument(detectedText, documentType);
  }
  
  throw new Error('No text detected by Azure Vision');
};

/**
 * AWS Textract Processing
 */
const processWithAWSTextract = async (imageData, documentType) => {
  // For production, implement AWS Textract integration
  // This requires AWS SDK and proper credentials
  throw new Error('AWS Textract integration not implemented yet');
};

/**
 * Pattern-based extraction for fallback
 */
const extractWithPatterns = async (imageData, documentType) => {
  // This would require a simpler OCR library or manual pattern matching
  // For now, return null to indicate no extraction possible
  return null;
};

/**
 * Parse Kenyan Documents using regex patterns
 */
const parseKenyanDocument = (text, documentType) => {
  const extractedData = {};
  const upperText = text.toUpperCase();
  const patterns = KENYAN_DOCUMENT_PATTERNS[getPatternKey(documentType.type)];
  
  if (!patterns) {
    console.warn(`No patterns defined for document type: ${documentType.type}`);
    return extractedData;
  }
  
  switch (documentType.type) {
    case 'National ID Copy':
      // Extract ID number
      const idMatch = text.match(patterns.idNumber);
      if (idMatch) {
        extractedData.idNumber = idMatch[0];
      }
      
      // Extract full name (first valid name match)
      const nameMatches = upperText.match(patterns.names);
      if (nameMatches) {
        // Filter out common words that aren't names
        const validNames = nameMatches.filter(name => 
          name.length > 3 && 
          !['REPUBLIC', 'KENYA', 'NATIONAL', 'IDENTITY', 'CARD'].includes(name.trim())
        );
        if (validNames.length > 0) {
          extractedData.fullName = validNames[0].trim();
        }
      }
      
      // Extract date of birth
      const dobMatch = text.match(patterns.dateOfBirth);
      if (dobMatch) {
        extractedData.dateOfBirth = dobMatch[0];
      }
      break;
      
    case 'KRA PIN Certificate':
      // Extract KRA PIN
      const pinMatch = text.match(patterns.pin);
      if (pinMatch) {
        extractedData.kraPin = pinMatch[0];
      }
      
      // Extract taxpayer name
      const taxpayerMatch = upperText.match(patterns.taxpayerName);
      if (taxpayerMatch) {
        extractedData.fullName = taxpayerMatch[1].trim();
      }
      
      // Extract status
      const statusMatch = upperText.match(patterns.status);
      if (statusMatch) {
        extractedData.pinStatus = statusMatch[1];
      }
      break;
      
    case 'Vehicle Logbook':
      // Extract registration number
      const regMatch = text.match(patterns.registration);
      if (regMatch) {
        extractedData.vehicleRegistrationNumber = regMatch[0].replace(/\s+/g, ' ').trim();
      }
      
      // Extract make
      const makeMatch = upperText.match(patterns.make);
      if (makeMatch) {
        const modelMatch = upperText.match(patterns.model);
        if (modelMatch) {
          extractedData.makeModel = `${makeMatch[1]} ${modelMatch[1]}`;
        } else {
          extractedData.makeModel = makeMatch[1];
        }
      }
      
      // Extract year
      const yearMatch = text.match(patterns.year);
      if (yearMatch) {
        const year = parseInt(yearMatch[0]);
        if (year >= 1980 && year <= new Date().getFullYear()) {
          extractedData.yearOfManufacture = yearMatch[0];
        }
      }
      
      // Extract engine capacity
      const engineMatch = text.match(patterns.engineCapacity);
      if (engineMatch) {
        extractedData.vehicleEngineCapacity = engineMatch[1];
      }
      break;
      
    case 'Driving License':
      // Extract license number
      const licenseMatch = text.match(patterns.licenseNumber);
      if (licenseMatch) {
        extractedData.licenseNumber = licenseMatch[0];
      }
      
      // Extract holder name
      const holderMatch = upperText.match(patterns.holderName);
      if (holderMatch) {
        extractedData.fullName = holderMatch[1].trim();
      }
      
      // Extract expiry date
      const expiryMatch = text.match(patterns.expiryDate);
      if (expiryMatch) {
        extractedData.expiryDate = expiryMatch[1];
      }
      break;
  }
  
  return extractedData;
};

/**
 * Helper Functions
 */
const getPatternKey = (documentType) => {
  const typeMap = {
    'National ID Copy': 'nationalId',
    'KRA PIN Certificate': 'kraPin',
    'Vehicle Logbook': 'vehicleLogbook',
    'Driving License': 'drivingLicense'
  };
  return typeMap[documentType];
};

const extractTextFromAzureRegions = (regions) => {
  let text = '';
  regions.forEach(region => {
    region.lines.forEach(line => {
      line.words.forEach(word => {
        text += word.text + ' ';
      });
      text += '\n';
    });
  });
  return text.trim();
};

const calculateConfidence = (extractedData, documentType) => {
  const expectedFields = documentType.extractFields || [];
  const extractedFields = Object.keys(extractedData);
  const matchedFields = expectedFields.filter(field => extractedFields.includes(field));
  
  if (expectedFields.length === 0) return 0.5;
  return matchedFields.length / expectedFields.length;
};

/**
 * Document Validation
 */
export const validateDocumentData = (extractedData, formData, documentType) => {
  const mismatches = [];
  
  documentType.extractFields.forEach(field => {
    if (extractedData[field] && formData[field]) {
      const extractedValue = normalizeText(extractedData[field]);
      const formValue = normalizeText(formData[field]);
      
      if (extractedValue !== formValue) {
        mismatches.push({
          field,
          formValue: formData[field],
          extractedValue: extractedData[field],
          fieldLabel: getFieldLabel(field),
          confidence: getFieldConfidence(field, extractedData[field])
        });
      }
    }
  });
  
  return mismatches;
};

const normalizeText = (text) => {
  return text.toString().toLowerCase().trim().replace(/\s+/g, ' ');
};

const getFieldLabel = (field) => {
  const labels = {
    fullName: 'Full Name',
    idNumber: 'ID Number',
    vehicleRegistrationNumber: 'Vehicle Registration',
    makeModel: 'Make & Model',
    yearOfManufacture: 'Year of Manufacture',
    vehicleEngineCapacity: 'Engine Capacity',
    kraPin: 'KRA PIN',
    licenseNumber: 'License Number',
    dateOfBirth: 'Date of Birth',
    expiryDate: 'Expiry Date'
  };
  return labels[field] || field;
};

const getFieldConfidence = (field, value) => {
  // Calculate confidence based on field type and value patterns
  switch (field) {
    case 'idNumber':
      return /^\d{8}$/.test(value) ? 0.95 : 0.7;
    case 'kraPin':
      return /^A\d{9}[A-Z]$/.test(value) ? 0.95 : 0.7;
    case 'vehicleRegistrationNumber':
      return /^[A-Z]{2,3}\s?\d{2,4}[A-Z]?$/.test(value) ? 0.9 : 0.6;
    case 'yearOfManufacture':
      const year = parseInt(value);
      return (year >= 1980 && year <= new Date().getFullYear()) ? 0.9 : 0.5;
    default:
      return 0.8;
  }
};
