// Static generic (non-motor) insurance catalog
// Fully frontend-defined: lines, products, schemas
// Adjust / add products here and increment CATALOG_VERSION if you later implement versioning.

export const CATALOG_VERSION = '2025-10-07-initial-static';

export const GENERIC_LINES = [
  { code: 'WIBA', name: 'WIBA Insurance' },
  { code: 'LAST_EXPENSE', name: 'Last Expense Insurance' },
  { code: 'PERSONAL_ACCIDENT', name: 'Personal Accident Insurance' },
  { code: 'DOMESTIC_PACKAGE', name: 'Domestic Package Insurance' },
];

// Field helper refs:
// type: text | number | boolean | date | select | multi_select | repeat_group
// repeat_group field contains: { type: 'repeat_group', key, label, schema: { fields: [...] } }

export const GENERIC_PRODUCTS = {
  WIBA: [
    {
      code: 'WIBA_STANDARD',
      name: 'WIBA Standard',
      pricing_model: 'FLAT',
      adapter_key: 'wiba_flat',
      requires_manual_underwriting: false,
      form_schema: {
        fields: [
          { key: 'employerName', label: 'Employer Name', type: 'text', required: true },
          { key: 'annualPayroll', label: 'Annual Payroll (KES)', type: 'number', required: true },
          { key: 'industry', label: 'Industry / Sector', type: 'text', required: true },
          { key: 'staffCount', label: 'Number of Staff', type: 'number', required: true },
        ],
      },
    },
  ],
  LAST_EXPENSE: [
    {
      code: 'LAST_EXPENSE_FAMILY',
      name: 'Family Cover',
      pricing_model: 'FAMILY',
      adapter_key: 'last_expense_family',
      requires_manual_underwriting: false,
      form_schema: {
        fields: [
          { key: 'principalName', label: 'Principal Name', type: 'text', required: true },
          { key: 'principalAge', label: 'Principal Age', type: 'number', required: true },
          { key: 'dependants', label: 'Dependants', type: 'repeat_group', required: false, schema: { fields: [
            { key: 'name', label: 'Name', type: 'text', required: true },
            { key: 'age', label: 'Age', type: 'number', required: true },
            { key: 'relation', label: 'Relation', type: 'text', required: true },
          ]}},
        ],
      },
    },
  ],
  PERSONAL_ACCIDENT: [
    {
      code: 'PA_BASIC',
      name: 'Personal Accident Basic',
      pricing_model: 'FLAT',
      adapter_key: 'personal_accident_flat',
      requires_manual_underwriting: false,
      form_schema: {
        fields: [
          { key: 'insuredName', label: 'Insured Name', type: 'text', required: true },
          { key: 'insuredAge', label: 'Age', type: 'number', required: true },
          { key: 'occupation', label: 'Occupation', type: 'text', required: true },
          { key: 'sumInsured', label: 'Sum Insured (KES)', type: 'number', required: true },
        ],
      },
    },
  ],
  DOMESTIC_PACKAGE: [
    {
      code: 'DOMESTIC_BASIC',
      name: 'Domestic Package Basic',
      pricing_model: 'TIERED',
      adapter_key: 'domestic_package_tiered',
      requires_manual_underwriting: false,
      form_schema: {
        fields: [
          { key: 'homeownerName', label: 'Homeowner Name', type: 'text', required: true },
          { key: 'location', label: 'Property Location', type: 'text', required: true },
          { key: 'structureType', label: 'Structure Type', type: 'text', required: true },
          { key: 'buildingValue', label: 'Building Value (KES)', type: 'number', required: true },
          { key: 'contentsValue', label: 'Contents Value (KES)', type: 'number', required: true },
        ],
      },
    },
  ],
};

export function getLineProducts(lineCode) {
  return GENERIC_PRODUCTS[lineCode] || [];
}

export function getProduct(lineCode, productCode) {
  return getLineProducts(lineCode).find(p => p.code === productCode) || null;
}
