// Document Type Detector - Simple client-side validation for Motor 2 KYC documents
// Detects document type from OCR extracted fields and text to prevent mismatches

/**
 * Detect document type from OCR result
 * @param {Object} result - OCR result from HybridDocumentService { fields, rawFields, diagnostics, rawText }
 * @returns {string} - Detected type: 'logbook', 'national_id', 'kra_pin', 'valuation_report', 'business_permit', 'unknown'
 */
export function detectDocumentType(result) {
  if (!result || (!result.fields && !result.rawFields && !result.rawText)) {
    return 'unknown';
  }

  // Combine canonical and raw fields for better coverage
  const fields = { ...(result.rawFields || {}), ...(result.fields || {}) };
  const rawText = (result.rawText || '').toLowerCase();
  const fieldKeys = Object.keys(fields).map(k => k.toLowerCase());

  // Strong markers for vehicle logbook (if >=2 present, it's a logbook)
  const strongLogbookKeys = ['registration', 'reg_no', 'regno', 'chassis', 'chassis_number', 'engine', 'engine_number'];
  const strongMatches = strongLogbookKeys.filter(ind => fieldKeys.some(k => k.includes(ind)));
  const hasStrongLogbook = strongMatches.length >= 2; // e.g., registration + chassis

  // Indicator sets with weights
  const indicators = {
    national_id: {
      keys: [
        { k: 'national_id', w: 3 }, { k: 'id_number', w: 3 }, { k: 'id no', w: 3 },
        { k: 'date_of_birth', w: 2 }, { k: 'dob', w: 2 }, { k: 'sex', w: 1 }, { k: 'gender', w: 1 },
        { k: 'full_name', w: 1 }, { k: 'surname', w: 1 }, { k: 'given_names', w: 1 }, { k: 'id_type', w: 2 }
      ],
      text: [ { t: 'republic of kenya', w: 2 }, { t: 'national identity card', w: 3 } ]
    },
    logbook: {
      keys: [
        { k: 'registration', w: 4 }, { k: 'reg_no', w: 3 }, { k: 'regno', w: 3 },
        { k: 'chassis', w: 4 }, { k: 'chassis_number', w: 4 },
        { k: 'engine', w: 4 }, { k: 'engine_number', w: 4 },
        { k: 'make', w: 2 }, { k: 'model', w: 2 }, { k: 'year', w: 1 }, { k: 'colour', w: 1 }, { k: 'color', w: 1 },
        { k: 'body_type', w: 1 }, { k: 'vehicle_type', w: 1 }, { k: 'owner_name', w: 1 }
      ],
      text: [
        { t: 'logbook', w: 3 }, { t: 'registration book', w: 3 }, { t: 'vehicle registration', w: 3 },
        { t: 'chassis number', w: 2 }, { t: 'engine number', w: 2 }
      ]
    },
    kra_pin: {
      keys: [ { k: 'pin', w: 3 }, { k: 'kra', w: 2 }, { k: 'tax', w: 1 }, { k: 'taxpayer', w: 2 }, { k: 'personal_identification_number', w: 4 } ],
      text: [ { t: 'kenya revenue authority', w: 3 }, { t: 'pin certificate', w: 3 }, { t: 'kra', w: 2 } ]
    },
    valuation_report: {
      keys: [ { k: 'valuation', w: 3 }, { k: 'market_value', w: 2 }, { k: 'assessed_value', w: 2 }, { k: 'valuer', w: 2 }, { k: 'valuation_date', w: 2 } ],
      text: [ { t: 'valuation report', w: 3 }, { t: 'market value', w: 2 } ]
    },
    business_permit: {
      keys: [ { k: 'permit', w: 3 }, { k: 'business', w: 1 }, { k: 'license', w: 2 }, { k: 'licence', w: 2 }, { k: 'business_name', w: 2 }, { k: 'county', w: 1 } ],
      text: [ { t: 'business permit', w: 3 }, { t: 'trade license', w: 2 } ]
    }
  };

  const scoreType = (type) => {
    const cfg = indicators[type];
    let score = 0;
    if (cfg?.keys) {
      for (const { k, w } of cfg.keys) {
        if (fieldKeys.some(key => key.includes(k))) score += w;
      }
    }
    if (cfg?.text && rawText) {
      for (const { t, w } of cfg.text) {
        if (rawText.includes(t)) score += w;
      }
    }
    return score;
  };

  const scores = {
    logbook: scoreType('logbook') + (hasStrongLogbook ? 6 : 0), // boost strong matches
    national_id: scoreType('national_id'),
    kra_pin: scoreType('kra_pin'),
    valuation_report: scoreType('valuation_report'),
    business_permit: scoreType('business_permit'),
  };

  // MUTUAL EXCLUSIVITY: Vehicle documents cannot be ID/KRA documents
  // If logbook score is high, disqualify personal document types
  if (scores.logbook >= 6 || hasStrongLogbook) {
    scores.national_id = 0;
    scores.kra_pin = 0;
  }
  
  // Conversely, if ID/KRA signals are very strong, reduce logbook confidence
  const hasStrongIdSignals = scores.national_id >= 5 || scores.kra_pin >= 5;
  if (hasStrongIdSignals && !hasStrongLogbook) {
    scores.logbook = Math.max(0, scores.logbook - 3);
  }

  // Prefer logbook when strong vehicle markers present, even if ID fields exist
  if (hasStrongLogbook) return 'logbook';

  // Check if backend explicitly identified the document type
  const backendType = result.documentType || result.document_type || result.docType;
  if (backendType) {
    const normalized = backendType.toLowerCase().replace(/_/g, '').replace(/-/g, '');
    if (normalized.includes('kra') || normalized.includes('pin')) return 'kra_pin';
    if (normalized.includes('logbook') || normalized.includes('vehicle')) return 'logbook';
    if (normalized.includes('national') || normalized.includes('id')) return 'national_id';
    if (normalized.includes('valuation')) return 'valuation_report';
    if (normalized.includes('permit') || normalized.includes('business')) return 'business_permit';
  }

  // If backend provided a guessedType, use it only when it aligns with scores or no strong conflict
  const guessed = result.diagnostics?.guessedType?.toLowerCase();
  const guessedMap = { id: 'national_id', national_id: 'national_id', logbook: 'logbook', vehicle: 'logbook', kra: 'kra_pin', pin: 'kra_pin', valuation: 'valuation_report', permit: 'business_permit' };
  const mappedGuess = guessedMap[guessed];
  if (mappedGuess) {
    // If guess has score within 2 points of the max, accept; else trust scores
    const maxScore = Math.max(...Object.values(scores));
    const guessScore = scores[mappedGuess] ?? 0;
    if (guessScore >= maxScore - 2) {
      return mappedGuess;
    }
  }

  // Pick the highest score; tie-breaker prefers logbook → national_id → kra_pin → others
  const entries = Object.entries(scores);
  entries.sort((a, b) => b[1] - a[1]);
  const topScore = entries[0][1];
  const topTypes = entries.filter(([, s]) => s === topScore).map(([t]) => t);
  if (topTypes.length === 1) return topTypes[0];
  if (topTypes.includes('logbook')) return 'logbook';
  if (topTypes.includes('national_id')) return 'national_id';
  if (topTypes.includes('kra_pin')) return 'kra_pin';
  return topTypes[0] || 'unknown';
}

/**
 * Get human-readable document type name
 */
export function getDocumentTypeName(type) {
  const names = {
    'logbook': 'Vehicle Logbook',
    'national_id': 'National ID',
    'kra_pin': 'KRA PIN Certificate',
    'valuation_report': 'Valuation Report',
    'business_permit': 'Business Permit',
    'generic': 'Document',
    'unknown': 'Unknown Document'
  };
  return names[type] || 'Document';
}

/**
 * Validate if detected type matches expected type
 * @param {string} expectedType - The type we expect based on upload slot
 * @param {string} detectedType - The type detected from OCR
 * @returns {Object} - { valid: boolean, message: string }
 */
export function validateDocumentType(expectedType, detectedType) {
  if (detectedType === 'unknown') {
    return {
      valid: false,
      warning: true,
      message: `Could not verify document type. Expected ${getDocumentTypeName(expectedType)}. Please ensure you've uploaded the correct document.`
    };
  }

  if (expectedType === detectedType) {
    return {
      valid: true,
      message: `Document verified as ${getDocumentTypeName(detectedType)}`
    };
  }

  return {
    valid: false,
    warning: false,
    message: `Document mismatch detected!\n\nExpected: ${getDocumentTypeName(expectedType)}\nDetected: ${getDocumentTypeName(detectedType)}\n\nPlease upload the correct document or verify your selection.`
  };
}
