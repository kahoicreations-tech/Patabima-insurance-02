// Frontend mirror of backend insurance categories & products.
// Used for display labels and future dynamic form schemas.

export const INSURANCE_CATEGORIES = [
  { key: 'MOTOR', displayName: 'Motor Vehicle Insurance' },
  { key: 'MEDICAL', displayName: 'Medical Insurance' },
  { key: 'WIBA', displayName: 'WIBA Insurance' },
  { key: 'LAST_EXPENSE', displayName: 'Last Expense Insurance' },
  { key: 'TRAVEL', displayName: 'Travel Insurance' },
  { key: 'PERSONAL_ACCIDENT', displayName: 'Personal Accident Insurance' },
  { key: 'PROFESSIONAL_INDEMNITY', displayName: 'Professional Indemnity' },
  { key: 'DOMESTIC_PACKAGE', displayName: 'Domestic Package Insurance' },
];

export const CATEGORY_LABEL_MAP = INSURANCE_CATEGORIES.reduce((acc, c) => { acc[c.key] = c.displayName; return acc; }, {});

// Minimal product name mapping (extend when backend exposes product codes consistently)
export const PRODUCT_CODE_LABEL_MAP = {
  // Standard Motor Products
  MOTOR_PRIVATE_THIRD_PARTY: 'Private Motor - Third Party',
  MOTOR_PRIVATE_COMPREHENSIVE: 'Private Motor - Comprehensive',
  MOTOR_COMMERCIAL_LIGHT: 'Commercial Vehicle - Light',
  MOTOR_PSV: 'PSV Vehicle',
  
  // Motor 2 Extendible Products - Private
  PRIVATE_THIRD_PARTY_EXT: 'Private Third Party',
  PRIVATE_TOR_EXT: 'Private Time on Risk',
  
  // Motor 2 Extendible Products - Commercial
  COMMERCIAL_GENERAL_CARTAGE_TP_EXT: 'General Cartage Third Party',
  COMMERCIAL_GENERAL_CARTAGE_TP_EXT_PM: 'General Cartage Third Party (Prime Mover)',
  COMMERCIAL_OWN_GOODS_TP_EXT: 'Own Goods Third Party',
  
  // Motor 2 Extendible Products - PSV
  PSV_MATATU_1WK_TP_EXT: 'PSV Matatu (1 Week)',
  PSV_TOUR_VAN_TP_EXT: 'PSV Tour Van',
  PSV_TUKTUK_TP_EXT: 'PSV Tuk-Tuk',
  PSV_UBER_TP_EXT: 'PSV Uber/Taxi',
  
  // Motor 2 Extendible Products - TukTuk
  TUKTUK_COMMERCIAL_TP_EXT: 'Commercial Tuk-Tuk',
  TUKTUK_PSV_TP_EXT: 'PSV Tuk-Tuk',
  
  // Motor 2 Extendible Products - Special
  SPECIAL_INSTITUTIONAL_TP_EXT: 'Institutional Third Party',
  
  // Other Insurance Products
  MEDICAL_INDIVIDUAL_STANDARD: 'Medical Individual Standard',
  MEDICAL_CORPORATE: 'Medical Corporate',
  WIBA_STANDARD: 'WIBA Standard',
  LAST_EXPENSE_FAMILY: 'Last Expense Family Cover',
  TRAVEL_INTERNATIONAL: 'Travel International',
  PA_INDIVIDUAL: 'Personal Accident Individual',
  PI_STANDARD: 'Professional Indemnity Standard',
  DOMESTIC_PACKAGE_STANDARD: 'Domestic Package Standard',
};

export function getCategoryLabel(categoryKey) {
  if (!categoryKey) return 'Other Insurance';
  const norm = categoryKey.toString().toUpperCase();
  return CATEGORY_LABEL_MAP[norm] || CATEGORY_LABEL_MAP[norm.replace('-', '_')] || 'Other Insurance';
}

export function getProductLabel(productCodeOrName) {
  if (!productCodeOrName) return null;
  const raw = productCodeOrName.toString();
  // If it's an obvious UUID/GUID, suppress it.
  if (/^[0-9a-fA-F-]{32,36}$/.test(raw)) return null;
  const upper = raw.toUpperCase();
  return PRODUCT_CODE_LABEL_MAP[upper] || raw.replace(/_/g, ' ');
}
