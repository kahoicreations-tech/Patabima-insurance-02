/**
 * Static Motor Categories and Subcategories
 * 
 * This file contains hardcoded motor insurance categories and subcategories
 * to improve performance in Motor3 (no API calls needed for category selection).
 * 
 * Motor vehicle categories rarely change, so maintaining a static version
 * is more efficient than fetching from API on every session.
 * 
 * VERSION: 1.1765813593352
 * LAST_UPDATED: 2025-12-15
 * DATA_SOURCE: Backend MotorCategory and MotorSubcategory models
 * GENERATED_BY: scripts/syncMotorCategories.js
 * 
 * How to update:
 * 1. Run checkCategoryVersion() to detect if backend has changes
 * 2. If changes detected, run npm run sync-motor-categories
 * 3. VERSION and LAST_UPDATED are auto-generated
 */

export const CATEGORY_VERSION = "1.1765813593352";
export const LAST_CATEGORY_UPDATE = "2025-12-15";

/**
 * Motor Insurance Categories
 * Matches backend MotorCategory model structure
 */
export const MOTOR_CATEGORIES = [
  {
    id: "02a099fd-e88b-4b61-8f64-0e3eb7ee173f",
    code: "PRIVATE",
    name: "Private",
    description: "Personal vehicles for private use",
    icon: "🚗",
    pricing_type: "dynamic",
    sort_order: 1,
    requires_tonnage: false,
    requires_engine_capacity: false,
    requires_passenger_count: false,
    requires_passenger_type: false,
    requires_carrying_capacity: false,
    supports_time_period_variants: false,
    min_vehicle_age: 0,
    max_vehicle_age: 25,
    is_active: true,
  },
  {
    id: "fe27c128-972d-4a08-8893-1ad922d882bd",
    code: "COMMERCIAL",
    name: "Commercial",
    description: "Goods carriers and commercial vehicles",
    icon: "🚚",
    pricing_type: "dynamic",
    sort_order: 2,
    requires_tonnage: true,
    requires_engine_capacity: false,
    requires_passenger_count: false,
    requires_passenger_type: false,
    requires_carrying_capacity: false,
    supports_time_period_variants: false,
    min_vehicle_age: 0,
    max_vehicle_age: 20,
    is_active: true,
  },
  {
    id: "d4ee8d63-363f-40e1-a5fc-41748a26ef42",
    code: "PSV",
    name: "PSV",
    description: "Public service vehicles (matatu, buses)",
    icon: "🚌",
    pricing_type: "dynamic",
    sort_order: 3,
    requires_tonnage: false,
    requires_engine_capacity: false,
    requires_passenger_count: true,
    requires_passenger_type: false,
    requires_carrying_capacity: false,
    supports_time_period_variants: true,
    min_vehicle_age: 0,
    max_vehicle_age: 20,
    is_active: true,
  },
  {
    id: "83a003d5-9c80-422b-9350-583f92bb9d55",
    code: "MOTORCYCLE",
    name: "Motorcycle",
    description: "Motorcycles including boda boda",
    icon: "🏍️",
    pricing_type: "dynamic",
    sort_order: 4,
    requires_tonnage: false,
    requires_engine_capacity: true,
    requires_passenger_count: false,
    requires_passenger_type: false,
    requires_carrying_capacity: false,
    supports_time_period_variants: true,
    min_vehicle_age: 0,
    max_vehicle_age: 15,
    is_active: true,
  },
  {
    id: "4f87a0cc-d791-4e20-9b96-39855211270e",
    code: "TUKTUK",
    name: "TukTuk",
    description: "Three-wheeler vehicles",
    icon: "🛺",
    pricing_type: "dynamic",
    sort_order: 5,
    requires_tonnage: false,
    requires_engine_capacity: false,
    requires_passenger_count: true,
    requires_passenger_type: false,
    requires_carrying_capacity: false,
    supports_time_period_variants: false,
    min_vehicle_age: 0,
    max_vehicle_age: 15,
    is_active: true,
  },
  {
    id: "63206394-bcc9-4ca4-9a2f-faf4cbadddb0",
    code: "SPECIAL",
    name: "Special Classes",
    description: "Agricultural, institutional, and special vehicles",
    icon: "🚜",
    pricing_type: "dynamic",
    sort_order: 6,
    requires_tonnage: true,
    requires_engine_capacity: false,
    requires_passenger_count: true,
    requires_passenger_type: true,
    requires_carrying_capacity: false,
    supports_time_period_variants: false,
    min_vehicle_age: 0,
    max_vehicle_age: 25,
    is_active: true,
  }
];

/**
 * Motor Insurance Subcategories
 * Matches backend MotorSubcategory model structure
 * Organized by category for easy lookup
 */
export const MOTOR_SUBCATEGORIES = {
  PRIVATE: [
    {
      id: "PRIVATE_THIRD_PARTY_EXT",
      category_code: "PRIVATE",
      subcategory_code: "PRIVATE_THIRD_PARTY_EXT",
      name: "Third Party (Extended)",
      public_label: "Third Party (Extended)",
      coverage_type: "THIRD_PARTY",
      description: "",
      pricing_model: "FIXED",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "PRIVATE_THIRD_PARTY",
      category_code: "PRIVATE",
      subcategory_code: "PRIVATE_THIRD_PARTY",
      name: "Third Party",
      public_label: "Third Party",
      coverage_type: "THIRD_PARTY",
      description: "",
      pricing_model: "FIXED",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "PRIVATE_COMPREHENSIVE",
      category_code: "PRIVATE",
      subcategory_code: "PRIVATE_COMPREHENSIVE",
      name: "Comprehensive",
      public_label: "Comprehensive",
      coverage_type: "COMPREHENSIVE",
      description: "",
      pricing_model: "BRACKET",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "PRIVATE_TOR",
      category_code: "PRIVATE",
      subcategory_code: "PRIVATE_TOR",
      name: "Third Party (T.O.R)",
      public_label: "Third Party (T.O.R)",
      coverage_type: "TOR",
      description: "",
      pricing_model: "FIXED",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    }
  ],
  COMMERCIAL: [
    {
      id: "COMMERCIAL_GENERAL_CARTAGE_TP",
      category_code: "COMMERCIAL",
      subcategory_code: "COMMERCIAL_GENERAL_CARTAGE_TP",
      name: "COMMERCIAL_GENERAL_CARTAGE_TP",
      coverage_type: "THIRD_PARTY",
      description: "",
      pricing_model: "TONNAGE",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "COMMERCIAL_GENERAL_CARTAGE_TP_PM",
      category_code: "COMMERCIAL",
      subcategory_code: "COMMERCIAL_GENERAL_CARTAGE_TP_PM",
      name: "COMMERCIAL_GENERAL_CARTAGE_TP_PM",
      coverage_type: "THIRD_PARTY",
      description: "",
      pricing_model: "TONNAGE",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "COMMERCIAL_OWN_GOODS_TP",
      category_code: "COMMERCIAL",
      subcategory_code: "COMMERCIAL_OWN_GOODS_TP",
      name: "COMMERCIAL_OWN_GOODS_TP",
      coverage_type: "THIRD_PARTY",
      description: "",
      pricing_model: "TONNAGE",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "COMMERCIAL_GENERAL_CARTAGE_TP_EXT",
      category_code: "COMMERCIAL",
      subcategory_code: "COMMERCIAL_GENERAL_CARTAGE_TP_EXT",
      name: "COMMERCIAL_GENERAL_CARTAGE_TP_EXT",
      coverage_type: "THIRD_PARTY_EXT",
      description: "",
      pricing_model: "TONNAGE",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "COMMERCIAL_GENERAL_CARTAGE_TP_EXT_PM",
      category_code: "COMMERCIAL",
      subcategory_code: "COMMERCIAL_GENERAL_CARTAGE_TP_EXT_PM",
      name: "COMMERCIAL_GENERAL_CARTAGE_TP_EXT_PM",
      coverage_type: "THIRD_PARTY_EXT",
      description: "",
      pricing_model: "TONNAGE",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "COMMERCIAL_OWN_GOODS_TP_EXT",
      category_code: "COMMERCIAL",
      subcategory_code: "COMMERCIAL_OWN_GOODS_TP_EXT",
      name: "COMMERCIAL_OWN_GOODS_TP_EXT",
      coverage_type: "THIRD_PARTY_EXT",
      description: "",
      pricing_model: "TONNAGE",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "COMMERCIAL_GENERAL_CARTAGE_COMP",
      category_code: "COMMERCIAL",
      subcategory_code: "COMMERCIAL_GENERAL_CARTAGE_COMP",
      name: "COMMERCIAL_GENERAL_CARTAGE_COMP",
      coverage_type: "COMPREHENSIVE",
      description: "",
      pricing_model: "TONNAGE",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "COMMERCIAL_OWN_GOODS_COMP",
      category_code: "COMMERCIAL",
      subcategory_code: "COMMERCIAL_OWN_GOODS_COMP",
      name: "COMMERCIAL_OWN_GOODS_COMP",
      coverage_type: "COMPREHENSIVE",
      description: "",
      pricing_model: "TONNAGE",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "COMMERCIAL_TOR",
      category_code: "COMMERCIAL",
      subcategory_code: "COMMERCIAL_TOR",
      name: "COMMERCIAL_TOR",
      coverage_type: "TOR",
      description: "",
      pricing_model: "TONNAGE",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    }
  ],
  PSV: [
    {
      id: "PSV_MATATU_1M_TP",
      category_code: "PSV",
      subcategory_code: "PSV_MATATU_1M_TP",
      name: "PSV_MATATU_1M_TP",
      coverage_type: "THIRD_PARTY",
      description: "",
      pricing_model: "PASSENGER",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "PSV_MATATU_2WKS_TP",
      category_code: "PSV",
      subcategory_code: "PSV_MATATU_2WKS_TP",
      name: "PSV_MATATU_2WKS_TP",
      coverage_type: "THIRD_PARTY",
      description: "",
      pricing_model: "PASSENGER",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "PSV_PLAIN_TPO",
      category_code: "PSV",
      subcategory_code: "PSV_PLAIN_TPO",
      name: "PSV_PLAIN_TPO",
      coverage_type: "THIRD_PARTY",
      description: "",
      pricing_model: "PASSENGER",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "PSV_TOUR_VAN_TP",
      category_code: "PSV",
      subcategory_code: "PSV_TOUR_VAN_TP",
      name: "PSV_TOUR_VAN_TP",
      coverage_type: "THIRD_PARTY",
      description: "",
      pricing_model: "PASSENGER",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "PSV_TUKTUK_TP",
      category_code: "PSV",
      subcategory_code: "PSV_TUKTUK_TP",
      name: "PSV_TUKTUK_TP",
      coverage_type: "THIRD_PARTY",
      description: "",
      pricing_model: "PASSENGER",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "PSV_UBER_TP",
      category_code: "PSV",
      subcategory_code: "PSV_UBER_TP",
      name: "PSV_UBER_TP",
      coverage_type: "THIRD_PARTY",
      description: "",
      pricing_model: "PASSENGER",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "PSV_MATATU_1WK_TP_EXT",
      category_code: "PSV",
      subcategory_code: "PSV_MATATU_1WK_TP_EXT",
      name: "PSV_MATATU_1WK_TP_EXT",
      coverage_type: "THIRD_PARTY_EXT",
      description: "",
      pricing_model: "PASSENGER",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "PSV_TOUR_VAN_TP_EXT",
      category_code: "PSV",
      subcategory_code: "PSV_TOUR_VAN_TP_EXT",
      name: "PSV_TOUR_VAN_TP_EXT",
      coverage_type: "THIRD_PARTY_EXT",
      description: "",
      pricing_model: "PASSENGER",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "PSV_TUKTUK_TP_EXT",
      category_code: "PSV",
      subcategory_code: "PSV_TUKTUK_TP_EXT",
      name: "PSV_TUKTUK_TP_EXT",
      coverage_type: "THIRD_PARTY_EXT",
      description: "",
      pricing_model: "PASSENGER",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "PSV_UBER_TP_EXT",
      category_code: "PSV",
      subcategory_code: "PSV_UBER_TP_EXT",
      name: "PSV_UBER_TP_EXT",
      coverage_type: "THIRD_PARTY_EXT",
      description: "",
      pricing_model: "PASSENGER",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "PSV_TOUR_VAN_COMP",
      category_code: "PSV",
      subcategory_code: "PSV_TOUR_VAN_COMP",
      name: "PSV_TOUR_VAN_COMP",
      coverage_type: "COMPREHENSIVE",
      description: "",
      pricing_model: "PASSENGER",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "PSV_UBER_COMP",
      category_code: "PSV",
      subcategory_code: "PSV_UBER_COMP",
      name: "PSV_UBER_COMP",
      coverage_type: "COMPREHENSIVE",
      description: "",
      pricing_model: "PASSENGER",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    }
  ],
  MOTORCYCLE: [
    {
      id: "MOTORCYCLE_PRIVATE_TP",
      category_code: "MOTORCYCLE",
      subcategory_code: "MOTORCYCLE_PRIVATE_TP",
      name: "MOTORCYCLE_PRIVATE_TP",
      coverage_type: "THIRD_PARTY",
      description: "",
      pricing_model: "ENGINE_CC",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "MOTORCYCLE_PSV_TP",
      category_code: "MOTORCYCLE",
      subcategory_code: "MOTORCYCLE_PSV_TP",
      name: "MOTORCYCLE_PSV_TP",
      coverage_type: "THIRD_PARTY",
      description: "",
      pricing_model: "ENGINE_CC",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "MOTORCYCLE_PSV_TP_6M",
      category_code: "MOTORCYCLE",
      subcategory_code: "MOTORCYCLE_PSV_TP_6M",
      name: "MOTORCYCLE_PSV_TP_6M",
      coverage_type: "THIRD_PARTY",
      description: "",
      pricing_model: "ENGINE_CC",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "MOTORCYCLE_PRIVATE_COMP",
      category_code: "MOTORCYCLE",
      subcategory_code: "MOTORCYCLE_PRIVATE_COMP",
      name: "MOTORCYCLE_PRIVATE_COMP",
      coverage_type: "COMPREHENSIVE",
      description: "",
      pricing_model: "ENGINE_CC",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "MOTORCYCLE_PSV_COMP",
      category_code: "MOTORCYCLE",
      subcategory_code: "MOTORCYCLE_PSV_COMP",
      name: "MOTORCYCLE_PSV_COMP",
      coverage_type: "COMPREHENSIVE",
      description: "",
      pricing_model: "ENGINE_CC",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "MOTORCYCLE_PSV_COMP_6M",
      category_code: "MOTORCYCLE",
      subcategory_code: "MOTORCYCLE_PSV_COMP_6M",
      name: "MOTORCYCLE_PSV_COMP_6M",
      coverage_type: "COMPREHENSIVE",
      description: "",
      pricing_model: "ENGINE_CC",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    }
  ],
  TUKTUK: [
    {
      id: "TUKTUK_COMMERCIAL_TP",
      category_code: "TUKTUK",
      subcategory_code: "TUKTUK_COMMERCIAL_TP",
      name: "TUKTUK_COMMERCIAL_TP",
      coverage_type: "THIRD_PARTY",
      description: "",
      pricing_model: "FIXED",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "TUKTUK_PSV_TP",
      category_code: "TUKTUK",
      subcategory_code: "TUKTUK_PSV_TP",
      name: "TUKTUK_PSV_TP",
      coverage_type: "THIRD_PARTY",
      description: "",
      pricing_model: "PASSENGER",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "TUKTUK_COMMERCIAL_TP_EXT",
      category_code: "TUKTUK",
      subcategory_code: "TUKTUK_COMMERCIAL_TP_EXT",
      name: "TUKTUK_COMMERCIAL_TP_EXT",
      coverage_type: "THIRD_PARTY_EXT",
      description: "",
      pricing_model: "FIXED",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "TUKTUK_PSV_TP_EXT",
      category_code: "TUKTUK",
      subcategory_code: "TUKTUK_PSV_TP_EXT",
      name: "TUKTUK_PSV_TP_EXT",
      coverage_type: "THIRD_PARTY_EXT",
      description: "",
      pricing_model: "PASSENGER",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "TUKTUK_COMMERCIAL_COMP",
      category_code: "TUKTUK",
      subcategory_code: "TUKTUK_COMMERCIAL_COMP",
      name: "TUKTUK_COMMERCIAL_COMP",
      coverage_type: "COMPREHENSIVE",
      description: "",
      pricing_model: "FIXED",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "TUKTUK_PSV_COMP",
      category_code: "TUKTUK",
      subcategory_code: "TUKTUK_PSV_COMP",
      name: "TUKTUK_PSV_COMP",
      coverage_type: "COMPREHENSIVE",
      description: "",
      pricing_model: "PASSENGER",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    }
  ],
  SPECIAL: [
    {
      id: "SPECIAL_AGRICULTURAL_TP",
      category_code: "SPECIAL",
      subcategory_code: "SPECIAL_AGRICULTURAL_TP",
      name: "SPECIAL_AGRICULTURAL_TP",
      coverage_type: "THIRD_PARTY",
      description: "",
      pricing_model: "TONNAGE",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "SPECIAL_INSTITUTIONAL_TP",
      category_code: "SPECIAL",
      subcategory_code: "SPECIAL_INSTITUTIONAL_TP",
      name: "SPECIAL_INSTITUTIONAL_TP",
      coverage_type: "THIRD_PARTY",
      description: "",
      pricing_model: "PASSENGER",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "SPECIAL_DRIVING_SCHOOL_TP",
      category_code: "SPECIAL",
      subcategory_code: "SPECIAL_DRIVING_SCHOOL_TP",
      name: "SPECIAL_DRIVING_SCHOOL_TP",
      coverage_type: "THIRD_PARTY",
      description: "",
      pricing_model: "TONNAGE",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "SPECIAL_KG_PLATE_TP",
      category_code: "SPECIAL",
      subcategory_code: "SPECIAL_KG_PLATE_TP",
      name: "SPECIAL_KG_PLATE_TP",
      coverage_type: "THIRD_PARTY",
      description: "",
      pricing_model: "FIXED",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "SPECIAL_INSTITUTIONAL_TP_EXT",
      category_code: "SPECIAL",
      subcategory_code: "SPECIAL_INSTITUTIONAL_TP_EXT",
      name: "SPECIAL_INSTITUTIONAL_TP_EXT",
      coverage_type: "THIRD_PARTY_EXT",
      description: "",
      pricing_model: "PASSENGER",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "SPECIAL_AGRICULTURAL_COMP",
      category_code: "SPECIAL",
      subcategory_code: "SPECIAL_AGRICULTURAL_COMP",
      name: "SPECIAL_AGRICULTURAL_COMP",
      coverage_type: "COMPREHENSIVE",
      description: "",
      pricing_model: "TONNAGE",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "SPECIAL_AMBULANCE_COMP",
      category_code: "SPECIAL",
      subcategory_code: "SPECIAL_AMBULANCE_COMP",
      name: "SPECIAL_AMBULANCE_COMP",
      coverage_type: "COMPREHENSIVE",
      description: "",
      pricing_model: "FIXED",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "SPECIAL_INSTITUTIONAL_COMP",
      category_code: "SPECIAL",
      subcategory_code: "SPECIAL_INSTITUTIONAL_COMP",
      name: "SPECIAL_INSTITUTIONAL_COMP",
      coverage_type: "COMPREHENSIVE",
      description: "",
      pricing_model: "PASSENGER",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "SPECIAL_DRIVING_SCHOOL_COMP",
      category_code: "SPECIAL",
      subcategory_code: "SPECIAL_DRIVING_SCHOOL_COMP",
      name: "SPECIAL_DRIVING_SCHOOL_COMP",
      coverage_type: "COMPREHENSIVE",
      description: "",
      pricing_model: "TONNAGE",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    },
    {
      id: "SPECIAL_FUEL_TANKER_COMP",
      category_code: "SPECIAL",
      subcategory_code: "SPECIAL_FUEL_TANKER_COMP",
      name: "SPECIAL_FUEL_TANKER_COMP",
      coverage_type: "COMPREHENSIVE",
      description: "",
      pricing_model: "TONNAGE",
      base_premium: null,
      is_active: true,
      sort_order: 0,
    }
  ]
};

/**
 * Get all active categories
 */
export const getActiveCategories = () => {
  return MOTOR_CATEGORIES.filter((cat) => cat.is_active);
};

/**
 * Get category by code
 */
export const getCategoryByCode = (code) => {
  return MOTOR_CATEGORIES.find((cat) => cat.code === code);
};

/**
 * Get subcategories for a category
 */
export const getSubcategoriesByCategory = (categoryCode) => {
  return MOTOR_SUBCATEGORIES[categoryCode] || [];
};

/**
 * Get active subcategories for a category
 */
export const getActiveSubcategoriesByCategory = (categoryCode) => {
  const subcategories = MOTOR_SUBCATEGORIES[categoryCode] || [];
  return subcategories.filter((sub) => sub.is_active);
};

/**
 * Get subcategory by code
 */
export const getSubcategoryByCode = (subcategoryCode) => {
  for (const categorySubcategories of Object.values(MOTOR_SUBCATEGORIES)) {
    const found = categorySubcategories.find(
      (sub) => sub.subcategory_code === subcategoryCode
    );
    if (found) return found;
  }
  return null;
};

/**
 * Check if a subcategory requires specific fields
 */
export const getSubcategoryRequirements = (subcategoryCode) => {
  const subcategory = getSubcategoryByCode(subcategoryCode);
  if (!subcategory) return {};

  const category = getCategoryByCode(subcategory.category_code);
  if (!category) return {};

  return {
    requires_tonnage: category.requires_tonnage,
    requires_engine_capacity: category.requires_engine_capacity,
    requires_passenger_count: category.requires_passenger_count,
    requires_passenger_type: category.requires_passenger_type,
    requires_carrying_capacity: category.requires_carrying_capacity,
    pricing_model: subcategory.pricing_model,
    coverage_type: subcategory.coverage_type,
  };
};

/**
 * Determine if a subcategory is "Third Party-like" (fixed pricing, minimal fields)
 */
export const isThirdPartyLike = (subcategoryCode) => {
  const subcategory = getSubcategoryByCode(subcategoryCode);
  if (!subcategory) return false;

  const coverageType = subcategory.coverage_type?.toLowerCase() || '';
  const code = subcategoryCode?.toLowerCase() || '';

  return (
    coverageType.includes('third_party') ||
    coverageType.includes('third-party') ||
    coverageType === 'tor' ||
    code.includes('tor') ||
    code.includes('third_party') ||
    code.includes('third-party') ||
    subcategory.pricing_model === 'FIXED'
  );
};

/**
 * Get all subcategories flattened (for search/filter)
 */
export const getAllSubcategories = () => {
  return Object.values(MOTOR_SUBCATEGORIES).flat();
};

export default {
  CATEGORY_VERSION,
  LAST_CATEGORY_UPDATE,
  MOTOR_CATEGORIES,
  MOTOR_SUBCATEGORIES,
  getActiveCategories,
  getCategoryByCode,
  getSubcategoriesByCategory,
  getActiveSubcategoriesByCategory,
  getSubcategoryByCode,
  getSubcategoryRequirements,
  isThirdPartyLike,
  getAllSubcategories,
};
