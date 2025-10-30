// Motor insurance configuration constants

export const PRODUCT_TYPES = {
  TOR: 'TOR',
  THIRD_PARTY: 'THIRD_PARTY',
  COMPREHENSIVE: 'COMPREHENSIVE',
};

export const CATEGORIES = [
  { key: 'private', label: 'Private' },
  { key: 'commercial', label: 'Commercial' },
  { key: 'psv', label: 'PSV' },
  { key: 'motorcycle', label: 'Motorcycle' },
  { key: 'tuktuk', label: 'TukTuk' },
  { key: 'special', label: 'Special Classes' },
];

export const LEVY_RATES = {
  ITL: 0.0025, // 0.25%
  PCF: 0.0025, // 0.25%
  STAMP_DUTY: 40, // KSh 40 fixed
};

export const VALIDATION_RULES = {
  common: {
    vehicle_make: { required: true },
    vehicle_model: { required: true },
    vehicle_year: { required: true, min: 1980, max: new Date().getFullYear() + 1 },
    vehicle_registration: { required: true },
  },
  TOR: {
    cover_days: { required: true, min: 1, max: 90 },
  },
  THIRD_PARTY: {},
  COMPREHENSIVE: {
    sum_insured: { required: true, min: 500000, max: 100000000 },
    excess_protector: { required: false },
    pvt: { required: false },
  },
  COMMERCIAL: {
    tonnage: { required: true, min: 0.1, max: 40 },
  },
  PSV: {
    passengers: { required: true, min: 1, max: 67 },
  },
};

export const DEBOUNCE_MS = 400;
