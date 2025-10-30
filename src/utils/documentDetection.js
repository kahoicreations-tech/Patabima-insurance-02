// Lightweight document type detection based on filename keywords.
// This is heuristic-only and meant to catch obvious mismatches quickly on-device.

const TYPE_LABELS = {
  national_id: 'National ID',
  kra_pin: 'KRA PIN Certificate',
  logbook: 'Vehicle Logbook',
  unknown: 'Unknown',
};

// Map UI slot keys to canonical types used in detection
export const slotKeyToType = (slotKey) => {
  switch (slotKey) {
    case 'nationalId':
      return 'national_id';
    case 'kraPin':
    case 'kraDocument':
      return 'kra_pin';
    case 'logbook':
      return 'logbook';
    default:
      return 'unknown';
  }
};

export const typeToLabel = (t) => TYPE_LABELS[t] || 'Unknown';

export function detectDocumentTypeFromFileName(fileName = '') {
  if (!fileName) return 'unknown';
  const name = String(fileName).toLowerCase();

  // KRA PIN indicators
  if (/(kra|pin|tax|itax|krapin)/.test(name)) {
    return 'kra_pin';
  }

  // Logbook indicators
  if (/(logbook|v5c|ntsa|chassis|vin|engine|registration|regno|reg_no|kdb|kda|kca|kcz)/.test(name)) {
    return 'logbook';
  }

  // National ID / Passport indicators
  if (/(id|national|kipande|passport|ppno|nin|alien|identity)/.test(name)) {
    return 'national_id';
  }

  return 'unknown';
}

// Given selected slot (expected) and file metadata, detect type and indicate mismatch
export function detectTypeAndValidate({ expectedSlotKey, fileName }) {
  const expectedType = slotKeyToType(expectedSlotKey);
  const detectedType = detectDocumentTypeFromFileName(fileName);

  const mismatch = detectedType !== 'unknown' && expectedType !== 'unknown' && detectedType !== expectedType;

  return {
    expectedType,
    detectedType,
    mismatch,
    expectedLabel: typeToLabel(expectedType),
    detectedLabel: typeToLabel(detectedType),
  };
}

export default {
  detectDocumentTypeFromFileName,
  detectTypeAndValidate,
  slotKeyToType,
  typeToLabel,
};
