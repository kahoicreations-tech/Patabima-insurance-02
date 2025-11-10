/**
 * Private Vehicle Subcategories - Static Data
 * Version: 1.0.0
 * Last Updated: 2025-11-10
 * 
 * DO NOT EDIT MANUALLY
 * Generated from backend via: python manage.py export_motor2_static
 * 
 * Products: 4 subcategories
 * - Third Party (FIXED pricing)
 * - Third Party Extendible (FIXED pricing)
 * - Time on Risk (FIXED pricing)
 * - Comprehensive (FIXED pricing)
 */

export const PRIVATE_SUBCATEGORIES = [
  {
    id: 'e5fda96b-fdda-4fe9-a53c-3cd8d5500ada',
    subcategory_code: 'PRIVATE_THIRD_PARTY',
    name: 'PRIVATE_THIRD_PARTY',
    description: '',
    category_code: 'PRIVATE',
    pricing_model: 'FIXED',
    product_type: 'THIRD_PARTY',
    is_complex: false,
    additional_fields: [],
    pricing_requirements: {},
    is_active: true,
    show_in_public: true,
    public_sort_order: 102,
    public_label: 'Private Third-Party'
  },
  {
    id: 'f74414bf-1e4f-4965-a953-dc4f46c3e265',
    subcategory_code: 'PRIVATE_THIRD_PARTY_EXT',
    name: 'PRIVATE_THIRD_PARTY_EXT',
    description: '',
    category_code: 'PRIVATE',
    pricing_model: 'FIXED',
    product_type: 'THIRD_PARTY',
    is_complex: false,
    additional_fields: [],
    pricing_requirements: {},
    is_active: true,
    show_in_public: true,
    public_sort_order: 203,
    public_label: 'Private Third-Party Extendible'
  },
  {
    id: 'd83ac6d4-9151-417f-b11e-4f2a3277ac82',
    subcategory_code: 'PRIVATE_TOR',
    name: 'Private Time On Risk',
    description: '',
    category_code: 'PRIVATE',
    pricing_model: 'FIXED',
    product_type: 'fixed',
    is_complex: false,
    additional_fields: [],
    pricing_requirements: {},
    is_active: true,
    show_in_public: true,
    public_sort_order: 401,
    public_label: 'TOR For Private'
  },
  {
    id: 'c3d87a28-c87a-4b21-951f-1b0586a9d908',
    subcategory_code: 'PRIVATE_COMPREHENSIVE',
    name: 'Private Comprehensive',
    description: '',
    category_code: 'PRIVATE',
    pricing_model: 'FIXED',
    product_type: 'comprehensive',
    is_complex: false,
    additional_fields: [],
    pricing_requirements: {},
    is_active: true,
    show_in_public: true,
    public_sort_order: 505,
    public_label: 'Private Comprehensive'
  }
];

export default PRIVATE_SUBCATEGORIES;
