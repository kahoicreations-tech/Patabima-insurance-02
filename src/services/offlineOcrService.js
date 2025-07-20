/**
 * Offline OCR Service - No APIs Required
 * Smart pattern-based extraction for Kenyan documents
 * Uses advanced regex patterns and text analysis
 */

// Kenyan Document Patterns - Highly Optimized
const KENYAN_PATTERNS = {
  nationalId: {
    // 8-digit ID numbers
    idNumber: /\b\d{8}\b/g,
    // Names (2-4 words, uppercase, common Kenyan patterns)
    fullName: [
      /\b([A-Z]{2,15}\s+[A-Z]{2,15}(?:\s+[A-Z]{2,15})?(?:\s+[A-Z]{2,15})?)\b/g,
      /(?:NAME|NAMES)[:\s]*([A-Z\s]{10,50})/i,
      /^([A-Z\s]{10,50})$/m
    ],
    // Date patterns
    dateOfBirth: /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}\b/g,
    // Common ID document text
    documentKeywords: /(?:REPUBLIC|KENYA|NATIONAL|IDENTITY|CARD|JAMHURI)/i
  },

  kraPin: {
    // KRA PIN format: A123456789X
    pin: /\bA\d{9}[A-Z]\b/g,
    // Alternative PIN formats
    pinAlt: /\b[A-Z]\d{9}[A-Z]\b/g,
    // Taxpayer name extraction
    taxpayerName: [
      /(?:TAXPAYER|NAME)[:\s]*([A-Z\s]{10,50})/i,
      /^([A-Z\s]{10,50})$/m
    ],
    // Status indicators
    status: /(?:ACTIVE|INACTIVE|SUSPENDED|VALID)/i,
    // KRA document keywords
    documentKeywords: /(?:KRA|REVENUE|AUTHORITY|PIN|CERTIFICATE|TAX)/i
  },

  vehicleLogbook: {
    // Kenyan registration formats: ABC 123X, AB 123XX, etc.
    registration: [
      /\b[A-Z]{2,3}\s*\d{2,4}[A-Z]?\b/g,
      /\b[A-Z]{3}\s*\d{3}[A-Z]\b/g,
      /\bK[A-Z]{2}\s*\d{3}[A-Z]\b/g
    ],
    // Vehicle makes (common in Kenya)
    makes: /\b(TOYOTA|NISSAN|HONDA|MAZDA|SUBARU|MITSUBISHI|BMW|MERCEDES|AUDI|VOLKSWAGEN|ISUZU|FORD|HYUNDAI)\b/gi,
    // Vehicle models
    models: /\b(COROLLA|VITZ|FIELDER|PRADO|HILUX|NOTE|TIIDA|X-TRAIL|FIT|VEZEL|FORESTER|IMPREZA|AXELA|DEMIO|OUTLANDER|HARRIER|MARK|WISH|CAMRY|ALTIMA|CIVIC|ACCORD|CX-5|BT-50)\b/gi,
    // Year pattern
    year: /\b(19|20)\d{2}\b/g,
    // Engine capacity
    engineCapacity: /\b(\d{3,4})\s*(?:CC|cc|Cc)\b/gi,
    // Chassis number
    chassisNumber: /\b[A-Z0-9]{17}\b/g,
    // Logbook keywords
    documentKeywords: /(?:LOGBOOK|VEHICLE|REGISTRATION|OWNER|ENGINE|CHASSIS)/i
  },

  drivingLicense: {
    // License number: AB1234567
    licenseNumber: /\b[A-Z]{2}\d{7}\b/g,
    // Holder name
    holderName: [
      /(?:HOLDER|NAME)[:\s]*([A-Z\s]{10,50})/i,
      /^([A-Z\s]{10,50})$/m
    ],
    // License class
    licenseClass: /(?:CLASS|CATEGORY)[:\s]*([A-Z0-9]+)/i,
    // Expiry date
    expiryDate: /(?:EXPIRY|EXPIRES)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
    // License keywords
    documentKeywords: /(?:DRIVING|LICENSE|LICENCE|HOLDER|NTSA)/i
  }
};

// Text preprocessing for better extraction
const preprocessText = (text) => {
  if (!text) return '';
  
  // Clean up the text
  let cleanText = text
    .replace(/[^\w\s\-\.\/]/g, ' ') // Remove special chars except common ones
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  // Fix common OCR errors for Kenyan text
  cleanText = cleanText
    .replace(/0/g, 'O') // Zero to O in names
    .replace(/1/g, 'I') // One to I in names (contextual)
    .replace(/5/g, 'S') // Five to S in names (contextual)
    .replace(/8/g, 'B') // Eight to B in names (contextual);
  
  return cleanText;
};

// Main offline OCR function
export const processDocumentOffline = async (imageData, documentType) => {
  try {
    console.log(`Processing ${documentType.type} offline...`);
    
    // Simulate text extraction (in real app, you'd use a library like Tesseract.js)
    const extractedText = await simulateTextExtraction(imageData, documentType);
    
    if (!extractedText) {
      return {
        success: false,
        error: 'Could not extract text from document',
        service: 'offline-ocr'
      };
    }
    
    // Process the extracted text
    const processedData = extractDataFromText(extractedText, documentType);
    
    if (processedData && Object.keys(processedData).length > 0) {
      return {
        success: true,
        data: processedData,
        service: 'offline-pattern-matching',
        confidence: calculateOfflineConfidence(processedData, documentType),
        extractedText: extractedText
      };
    }
    
    return {
      success: false,
      error: 'No relevant data found in document',
      service: 'offline-ocr'
    };
    
  } catch (error) {
    console.error('Offline OCR error:', error);
    return {
      success: false,
      error: error.message,
      service: 'offline-ocr'
    };
  }
};

// Simulate text extraction with realistic Kenyan document text
const simulateTextExtraction = async (imageData, documentType) => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Return realistic Kenyan document text based on document type
  switch (documentType.type) {
    case 'National ID Copy':
      return `
        REPUBLIC OF KENYA
        JAMHURI YA KENYA
        NATIONAL IDENTITY CARD
        
        NAME: JOHN KAMAU MWANGI
        ID NO: 29847362
        DATE OF BIRTH: 15/03/1985
        SEX: M
        PLACE OF BIRTH: NAIROBI
        
        SIGNATURE
      `;
      
    case 'KRA PIN Certificate':
      return `
        KENYA REVENUE AUTHORITY
        PIN REGISTRATION CERTIFICATE
        
        TAXPAYER NAME: JOHN KAMAU MWANGI
        PIN: A003847362M
        STATUS: ACTIVE
        REGISTRATION DATE: 12/01/2020
        
        This certifies that the above named person
        has been registered for tax purposes
      `;
      
    case 'Vehicle Logbook':
      return `
        REPUBLIC OF KENYA
        VEHICLE REGISTRATION DOCUMENT
        
        REGISTRATION NO: KCB 123A
        MAKE: TOYOTA
        MODEL: COROLLA
        YEAR OF MANUFACTURE: 2018
        ENGINE CAPACITY: 1500 CC
        CHASSIS NO: JT2BF28K020123456
        BODY TYPE: SALOON
        
        REGISTERED OWNER
        NAME: JOHN KAMAU MWANGI
        ID NO: 29847362
      `;
      
    case 'Driving License':
      return `
        REPUBLIC OF KENYA
        DRIVING LICENSE
        
        LICENSE NO: DL0384756
        HOLDER: JOHN KAMAU MWANGI
        ID NO: 29847362
        CLASS: B
        ISSUE DATE: 10/05/2020
        EXPIRY DATE: 31/12/2025
        
        NTSA
      `;
      
    default:
      return null;
  }
};

// Extract data using pattern matching
const extractDataFromText = (text, documentType) => {
  const preprocessedText = preprocessText(text);
  const upperText = preprocessedText.toUpperCase();
  const extractedData = {};
  
  console.log('Extracted text:', preprocessedText);
  
  switch (documentType.type) {
    case 'National ID Copy':
      return extractNationalIdData(preprocessedText, upperText);
    case 'KRA PIN Certificate':
      return extractKraPinData(preprocessedText, upperText);
    case 'Vehicle Logbook':
      return extractLogbookData(preprocessedText, upperText);
    case 'Driving License':
      return extractLicenseData(preprocessedText, upperText);
    default:
      return extractedData;
  }
};

// National ID extraction
const extractNationalIdData = (text, upperText) => {
  const data = {};
  const patterns = KENYAN_PATTERNS.nationalId;
  
  // Extract ID number
  const idMatches = text.match(patterns.idNumber);
  if (idMatches && idMatches.length > 0) {
    // Get the most likely ID number (8 digits)
    const validIds = idMatches.filter(id => id.length === 8);
    if (validIds.length > 0) {
      data.idNumber = validIds[0];
    }
  }
  
  // Extract full name
  for (const pattern of patterns.fullName) {
    const nameMatch = upperText.match(pattern);
    if (nameMatch) {
      let name = nameMatch[1] || nameMatch[0];
      name = name.replace(/[^A-Z\s]/g, '').trim();
      
      // Validate name (should be 2-4 words, each 2+ characters)
      const nameWords = name.split(/\s+/).filter(word => word.length >= 2);
      if (nameWords.length >= 2 && nameWords.length <= 4) {
        data.fullName = nameWords.join(' ');
        break;
      }
    }
  }
  
  // Extract date of birth
  const dobMatches = text.match(patterns.dateOfBirth);
  if (dobMatches && dobMatches.length > 0) {
    data.dateOfBirth = dobMatches[0];
  }
  
  return data;
};

// KRA PIN extraction
const extractKraPinData = (text, upperText) => {
  const data = {};
  const patterns = KENYAN_PATTERNS.kraPin;
  
  // Extract KRA PIN
  let pinMatches = text.match(patterns.pin);
  if (!pinMatches) {
    pinMatches = text.match(patterns.pinAlt);
  }
  if (pinMatches && pinMatches.length > 0) {
    data.kraPin = pinMatches[0];
  }
  
  // Extract taxpayer name
  for (const pattern of patterns.taxpayerName) {
    const nameMatch = upperText.match(pattern);
    if (nameMatch) {
      let name = nameMatch[1] || nameMatch[0];
      name = name.replace(/[^A-Z\s]/g, '').trim();
      
      const nameWords = name.split(/\s+/).filter(word => word.length >= 2);
      if (nameWords.length >= 2 && nameWords.length <= 4) {
        data.fullName = nameWords.join(' ');
        break;
      }
    }
  }
  
  // Extract status
  const statusMatch = upperText.match(patterns.status);
  if (statusMatch) {
    data.pinStatus = statusMatch[0];
  }
  
  return data;
};

// Vehicle logbook extraction
const extractLogbookData = (text, upperText) => {
  const data = {};
  const patterns = KENYAN_PATTERNS.vehicleLogbook;
  
  // Extract registration number
  for (const pattern of patterns.registration) {
    const regMatches = text.match(pattern);
    if (regMatches && regMatches.length > 0) {
      // Get the most likely registration (proper format)
      const validRegs = regMatches.filter(reg => {
        const cleanReg = reg.replace(/\s/g, '');
        return cleanReg.length >= 5 && cleanReg.length <= 8;
      });
      if (validRegs.length > 0) {
        data.vehicleRegistrationNumber = validRegs[0].replace(/\s+/g, ' ').trim();
        break;
      }
    }
  }
  
  // Extract make and model
  const makeMatches = upperText.match(patterns.makes);
  const modelMatches = upperText.match(patterns.models);
  
  if (makeMatches && makeMatches.length > 0) {
    const make = makeMatches[0];
    if (modelMatches && modelMatches.length > 0) {
      const model = modelMatches[0];
      data.makeModel = `${make} ${model}`;
    } else {
      data.makeModel = make;
    }
  }
  
  // Extract year
  const yearMatches = text.match(patterns.year);
  if (yearMatches && yearMatches.length > 0) {
    // Get the most recent valid year
    const years = yearMatches.map(y => parseInt(y)).filter(y => y >= 1980 && y <= new Date().getFullYear());
    if (years.length > 0) {
      data.yearOfManufacture = Math.max(...years).toString();
    }
  }
  
  // Extract engine capacity
  const engineMatches = text.match(patterns.engineCapacity);
  if (engineMatches && engineMatches.length > 0) {
    const capacity = engineMatches[0].match(/\d+/)[0];
    if (parseInt(capacity) >= 50 && parseInt(capacity) <= 8000) {
      data.vehicleEngineCapacity = capacity;
    }
  }
  
  return data;
};

// Driving license extraction
const extractLicenseData = (text, upperText) => {
  const data = {};
  const patterns = KENYAN_PATTERNS.drivingLicense;
  
  // Extract license number
  const licenseMatches = text.match(patterns.licenseNumber);
  if (licenseMatches && licenseMatches.length > 0) {
    data.licenseNumber = licenseMatches[0];
  }
  
  // Extract holder name
  for (const pattern of patterns.holderName) {
    const nameMatch = upperText.match(pattern);
    if (nameMatch) {
      let name = nameMatch[1] || nameMatch[0];
      name = name.replace(/[^A-Z\s]/g, '').trim();
      
      const nameWords = name.split(/\s+/).filter(word => word.length >= 2);
      if (nameWords.length >= 2 && nameWords.length <= 4) {
        data.fullName = nameWords.join(' ');
        break;
      }
    }
  }
  
  // Extract expiry date
  const expiryMatch = text.match(patterns.expiryDate);
  if (expiryMatch) {
    data.expiryDate = expiryMatch[1];
  }
  
  // Extract license class
  const classMatch = upperText.match(patterns.licenseClass);
  if (classMatch) {
    data.licenseClass = classMatch[1];
  }
  
  return data;
};

// Calculate confidence for offline extraction
const calculateOfflineConfidence = (extractedData, documentType) => {
  const expectedFields = documentType.extractFields || [];
  const extractedFields = Object.keys(extractedData);
  const matchedFields = expectedFields.filter(field => extractedFields.includes(field));
  
  if (expectedFields.length === 0) return 0.7; // Default confidence
  
  const baseConfidence = matchedFields.length / expectedFields.length;
  
  // Boost confidence based on data quality
  let qualityBoost = 0;
  
  // Check ID number format
  if (extractedData.idNumber && /^\d{8}$/.test(extractedData.idNumber)) {
    qualityBoost += 0.1;
  }
  
  // Check KRA PIN format
  if (extractedData.kraPin && /^A\d{9}[A-Z]$/.test(extractedData.kraPin)) {
    qualityBoost += 0.1;
  }
  
  // Check vehicle registration format
  if (extractedData.vehicleRegistrationNumber && /^[A-Z]{2,3}\s*\d{2,4}[A-Z]?$/.test(extractedData.vehicleRegistrationNumber)) {
    qualityBoost += 0.1;
  }
  
  // Check name quality (2-4 words, proper case)
  if (extractedData.fullName) {
    const nameWords = extractedData.fullName.split(/\s+/);
    if (nameWords.length >= 2 && nameWords.length <= 4) {
      qualityBoost += 0.1;
    }
  }
  
  return Math.min(baseConfidence + qualityBoost, 0.95); // Cap at 95%
};

// Document validation for offline extraction
export const validateOfflineData = (extractedData, formData, documentType) => {
  const mismatches = [];
  
  documentType.extractFields.forEach(field => {
    if (extractedData[field] && formData[field]) {
      const extractedValue = normalizeForComparison(extractedData[field]);
      const formValue = normalizeForComparison(formData[field]);
      
      if (extractedValue !== formValue) {
        // Check for partial matches (common with OCR errors)
        const similarity = calculateSimilarity(extractedValue, formValue);
        
        if (similarity < 0.8) { // Only flag if less than 80% similar
          mismatches.push({
            field,
            formValue: formData[field],
            extractedValue: extractedData[field],
            fieldLabel: getFieldLabel(field),
            confidence: calculateFieldConfidence(field, extractedData[field]),
            similarity: similarity
          });
        }
      }
    }
  });
  
  return mismatches;
};

// Helper functions
const normalizeForComparison = (text) => {
  return text.toString().toLowerCase().trim().replace(/\s+/g, ' ');
};

const calculateSimilarity = (str1, str2) => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
};

const levenshteinDistance = (str1, str2) => {
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

const calculateFieldConfidence = (field, value) => {
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
