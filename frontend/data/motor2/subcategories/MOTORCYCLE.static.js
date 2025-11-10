/**
 * Motorcycle Subcategories - Static Data
 * Version: 1.0.0
 * Last Updated: 2025-11-10
 * 
 * DO NOT EDIT MANUALLY
 * Generated from backend via: python manage.py export_motor2_static
 * 
 * Products: 6 subcategories
 * - Private & PSV Motorcycles (ENGINE_CC pricing)
 * - Third Party and Comprehensive variants
 */

export const MOTORCYCLE_SUBCATEGORIES = [
  {
    id: '87862519-800b-4655-b480-790228534766',
    subcategory_code: 'MOTORCYCLE_PRIVATE_TP',
    name: 'Private motorcycle third party',
    description: '',
    category_code: 'MOTORCYCLE',
    pricing_model: 'ENGINE_CC',
    product_type: 'THIRD_PARTY',
    is_complex: false,
    additional_fields: [],
    pricing_requirements: {},
    is_active: true,
    show_in_public: true,
    public_sort_order: 101,
    public_label: 'Private Motorcycle Third Party'
  },
  {
    id: 'ce88273c-85b0-4d72-a815-d9e9fef0b66a',
    subcategory_code: 'MOTORCYCLE_PSV_TP',
    name: 'PSV motorcycle third party',
    description: '',
    category_code: 'MOTORCYCLE',
    pricing_model: 'ENGINE_CC',
    product_type: 'THIRD_PARTY',
    is_complex: false,
    additional_fields: [],
    pricing_requirements: {},
    is_active: true,
    show_in_public: true,
    public_sort_order: 102,
    public_label: 'PSV Motorcycle Third Party'
  },
  {
    id: '8b31baec-cc54-4de4-9e60-82d932a61c85',
    subcategory_code: 'MOTORCYCLE_PSV_TP_6M',
    name: 'PSV motorcycle third-party 6 months',
    description: '',
    category_code: 'MOTORCYCLE',
    pricing_model: 'ENGINE_CC',
    product_type: 'THIRD_PARTY',
    is_complex: false,
    additional_fields: ['engine_capacity'],
    pricing_requirements: {
      requires_engine_capacity: true
    },
    is_active: true,
    show_in_public: true,
    public_sort_order: 103,
    public_label: 'PSV motorcycle third-party 6 months'
  },
  {
    id: '9050b00a-55a0-4bc2-ba54-d3d137514a33',
    subcategory_code: 'MOTORCYCLE_PRIVATE_COMP',
    name: 'Private Motorcycle comprehensive',
    description: '',
    category_code: 'MOTORCYCLE',
    pricing_model: 'ENGINE_CC',
    product_type: 'COMPREHENSIVE',
    is_complex: false,
    additional_fields: ['engine_capacity'],
    pricing_requirements: {
      requires_engine_capacity: true
    },
    is_active: true,
    show_in_public: true,
    public_sort_order: 504,
    public_label: 'Private Motorcycle Comprehensive'
  },
  {
    id: 'd5497b86-997f-47cc-822e-9ea23b8929a9',
    subcategory_code: 'MOTORCYCLE_PSV_COMP',
    name: 'PSV Motorcycle comprehensive',
    description: '',
    category_code: 'MOTORCYCLE',
    pricing_model: 'ENGINE_CC',
    product_type: 'COMPREHENSIVE',
    is_complex: false,
    additional_fields: ['engine_capacity'],
    pricing_requirements: {
      requires_engine_capacity: true
    },
    is_active: true,
    show_in_public: true,
    public_sort_order: 505,
    public_label: 'PSV Motorcycle comprehensive'
  },
  {
    id: 'ef6f9d94-afa6-4957-a6e1-c722dc3f327f',
    subcategory_code: 'MOTORCYCLE_PSV_COMP_6M',
    name: 'PSV motorcycle comprehensive 6 months',
    description: '',
    category_code: 'MOTORCYCLE',
    pricing_model: 'ENGINE_CC',
    product_type: 'COMPREHENSIVE',
    is_complex: false,
    additional_fields: ['engine_capacity'],
    pricing_requirements: {
      requires_engine_capacity: true
    },
    is_active: true,
    show_in_public: true,
    public_sort_order: 506,
    public_label: 'PSV motorcycle comprehensive 6 months'
  }
];

export default MOTORCYCLE_SUBCATEGORIES;
