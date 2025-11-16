// Centralized insurance category constants & metadata
// Each category has: key (slug), displayName, description, active flag (for feature toggling), and optional tags for classification

export const INSURANCE_CATEGORIES = [
  {
    key: 'motor',
    displayName: 'Motor Vehicle Insurance',
    description: 'Private, commercial, PSV, motorcycle, tuktuk and special classes',
    tags: ['vehicle','auto','motor'],
    active: true,
  },
  {
    key: 'medical',
    displayName: 'Medical Insurance',
    description: 'Individual and corporate medical cover with inpatient/outpatient benefits',
    tags: ['health','hospital','medical'],
    active: true,
  },
  {
    key: 'wiba',
    displayName: 'WIBA Insurance',
    description: 'Work Injury Benefits Act coverage for employees',
    tags: ['work','injury','employee'],
    active: true,
  },
  {
    key: 'last_expense',
    displayName: 'Last Expense Insurance',
    description: 'Funeral expense coverage plans',
    tags: ['funeral','burial','memorial'],
    active: true,
  },
  {
    key: 'travel',
    displayName: 'Travel Insurance',
    description: 'Local & international travel medical and trip coverage',
    tags: ['trip','journey','flight'],
    active: true,
  },
  {
    key: 'personal_accident',
    displayName: 'Personal Accident Insurance',
    description: 'Accidental death and disability protection',
    tags: ['accident','injury','pa'],
    active: true,
  },
  {
    key: 'professional_indemnity',
    displayName: 'Professional Indemnity Insurance',
    description: 'Liability protection for professional services',
    tags: ['liability','pi','professional'],
    active: true,
  },
  {
    key: 'domestic_package',
    displayName: 'Domestic Package Insurance',
    description: 'Combined cover for home building, contents, and liabilities',
    tags: ['home','house','domestic'],
    active: true,
  },
];

export const CATEGORY_KEYS = INSURANCE_CATEGORIES.map(c => c.key);

export function getCategoryMeta(key) {
  return INSURANCE_CATEGORIES.find(c => c.key === key) || null;
}

export function isValidCategory(key) {
  return CATEGORY_KEYS.includes(key);
}

// CommonJS interop so Node diagnostic scripts can require() without ESM project config
try {
  // eslint-disable-next-line no-undef
  if (typeof module !== 'undefined' && module.exports) {
    // eslint-disable-next-line no-undef
    module.exports = { INSURANCE_CATEGORIES, CATEGORY_KEYS, getCategoryMeta, isValidCategory };
  }
} catch {}
