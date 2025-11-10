/**
 * Commercial Vehicle Subcategories - Static Data
 * Version: 1.0.0
 * Last Updated: 2025-11-10
 * 
 * DO NOT EDIT MANUALLY
 * Generated from backend via: python manage.py export_motor2_static
 * 
 * Products: 9 subcategories
 * - Own Goods & General Cartage variants (TONNAGE pricing)
 * - Third Party, Third Party Extendible, TOR, Comprehensive
 */

export const COMMERCIAL_SUBCATEGORIES = [
  {
    id: 'b7ad403a-321a-4789-8fe4-0efb0dc4f817',
    subcategory_code: 'COMMERCIAL_OWN_GOODS_TP',
    name: 'Own Goods Third-Party',
    description: '',
    category_code: 'COMMERCIAL',
    pricing_model: 'TONNAGE',
    product_type: 'THIRD_PARTY',
    is_complex: false,
    additional_fields: ['tonnage'],
    pricing_requirements: {
      max_tonnage: 31,
      requires_tonnage: true
    },
    is_active: true,
    show_in_public: true,
    public_sort_order: 102,
    public_label: 'Own Goods Third-Party'
  },
  {
    id: '97fccac6-72a3-4263-b7a9-57335e71985e',
    subcategory_code: 'COMMERCIAL_GENERAL_CARTAGE_TP',
    name: 'General Cartage Third-Party',
    description: '',
    category_code: 'COMMERCIAL',
    pricing_model: 'TONNAGE',
    product_type: 'THIRD_PARTY',
    is_complex: false,
    additional_fields: ['tonnage'],
    pricing_requirements: {
      max_tonnage: 31,
      requires_tonnage: true
    },
    is_active: true,
    show_in_public: true,
    public_sort_order: 104,
    public_label: 'General Cartage Third-Party'
  },
  {
    id: 'f2e4c804-1bc3-4411-99ab-c91f1f08606c',
    subcategory_code: 'COMMERCIAL_GENERAL_CARTAGE_TP_PM',
    name: 'General Cartage Third-Party Prime Mover',
    description: '',
    category_code: 'COMMERCIAL',
    pricing_model: 'TONNAGE',
    product_type: 'THIRD_PARTY',
    is_complex: false,
    additional_fields: ['tonnage'],
    pricing_requirements: {
      max_tonnage: 31,
      requires_tonnage: true
    },
    is_active: true,
    show_in_public: true,
    public_sort_order: 106,
    public_label: 'General Cartage Third-Party Prime Mover'
  },
  {
    id: 'd7b4da34-6ad7-4a34-ae35-4cecbdb4b995',
    subcategory_code: 'COMMERCIAL_OWN_GOODS_TP_EXT',
    name: 'Own Goods Third-Party Extendible',
    description: '',
    category_code: 'COMMERCIAL',
    pricing_model: 'TONNAGE',
    product_type: 'THIRD_PARTY_EXT',
    is_complex: false,
    additional_fields: ['tonnage'],
    pricing_requirements: {
      max_tonnage: 31,
      requires_tonnage: true
    },
    is_active: true,
    show_in_public: true,
    public_sort_order: 203,
    public_label: 'Own Goods Third-Party Extendible'
  },
  {
    id: '927d6176-6b77-4650-a542-3874d629ae15',
    subcategory_code: 'COMMERCIAL_GENERAL_CARTAGE_TP_EXT',
    name: 'General Cartage Third-Party Extendible',
    description: '',
    category_code: 'COMMERCIAL',
    pricing_model: 'TONNAGE',
    product_type: 'THIRD_PARTY_EXT',
    is_complex: false,
    additional_fields: ['tonnage'],
    pricing_requirements: {
      max_tonnage: 31,
      requires_tonnage: true
    },
    is_active: true,
    show_in_public: true,
    public_sort_order: 205,
    public_label: 'General Cartage Third-Party Extendible'
  },
  {
    id: 'e319fcc3-a380-435c-ba1e-cb1f99e24c41',
    subcategory_code: 'COMMERCIAL_GENERAL_CARTAGE_TP_EXT_PM',
    name: 'General Cartage Third-Party Extendible Prime Mover',
    description: '',
    category_code: 'COMMERCIAL',
    pricing_model: 'TONNAGE',
    product_type: 'THIRD_PARTY_EXT',
    is_complex: false,
    additional_fields: ['tonnage'],
    pricing_requirements: {
      max_tonnage: 31,
      requires_tonnage: true
    },
    is_active: true,
    show_in_public: true,
    public_sort_order: 207,
    public_label: 'General Cartage Third-Party Extendible Prime Mover'
  },
  {
    id: 'd234cead-5ffa-4fd7-b75b-fc70002baf39',
    subcategory_code: 'COMMERCIAL_TOR',
    name: 'TOR For Commercial',
    description: '',
    category_code: 'COMMERCIAL',
    pricing_model: 'TONNAGE',
    product_type: 'TOR',
    is_complex: false,
    additional_fields: ['tonnage'],
    pricing_requirements: {
      max_tonnage: 31,
      requires_tonnage: true
    },
    is_active: true,
    show_in_public: true,
    public_sort_order: 401,
    public_label: 'TOR For Commercial'
  },
  {
    id: '927c1088-fae4-4db6-b014-9d92428eac50',
    subcategory_code: 'COMMERCIAL_GENERAL_CARTAGE_COMP',
    name: 'General Cartage Comprehensive',
    description: '',
    category_code: 'COMMERCIAL',
    pricing_model: 'TONNAGE',
    product_type: 'COMPREHENSIVE',
    is_complex: false,
    additional_fields: ['tonnage'],
    pricing_requirements: {
      max_tonnage: 31,
      requires_tonnage: true
    },
    is_active: true,
    show_in_public: true,
    public_sort_order: 508,
    public_label: 'General Cartage Comprehensive'
  },
  {
    id: '3600f66f-b8dd-45b5-bbef-1316b6fb90fb',
    subcategory_code: 'COMMERCIAL_OWN_GOODS_COMP',
    name: 'Own Goods Comprehensive',
    description: '',
    category_code: 'COMMERCIAL',
    pricing_model: 'TONNAGE',
    product_type: 'COMPREHENSIVE',
    is_complex: false,
    additional_fields: ['tonnage'],
    pricing_requirements: {
      max_tonnage: 31,
      requires_tonnage: true
    },
    is_active: true,
    show_in_public: true,
    public_sort_order: 509,
    public_label: 'Own Goods Comprehensive'
  }
];

export default COMMERCIAL_SUBCATEGORIES;
