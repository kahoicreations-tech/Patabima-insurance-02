#!/usr/bin/env node

/**
 * Sync Motor Categories from Backend to Static File
 * 
 * This script fetches the latest categories and subcategories from the Django backend
 * and updates the staticCategories.js file.
 * 
 * Usage:
 *   node scripts/syncMotorCategories.js
 *   or
 *   npm run sync-motor-categories
 * 
 * Requirements:
 *   - Django backend must be running locally or accessible
 *   - Update API_BASE_URL below if needed
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';
const OUTPUT_FILE = path.join(
  __dirname,
  '../frontend/screens/quotations/Motor3/constants/staticCategories.js'
);

/**
 * Fetch data from API
 */
function fetchFromAPI(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const client = url.startsWith('https') ? https : http;

    console.log(`📡 Fetching: ${url}`);

    client.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error(`Failed to parse JSON: ${error.message}`));
          }
        } else {
          reject(new Error(`API returned status ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`Network error: ${error.message}`));
    });
  });
}

/**
 * Fetch all categories
 */
async function fetchCategories() {
  const response = await fetchFromAPI('/api/v1/motor2/categories/');
  return response.categories || [];
}

/**
 * Fetch subcategories for a category
 */
async function fetchSubcategories(categoryCode) {
  const response = await fetchFromAPI(`/api/v1/motor2/subcategories/?category=${categoryCode}`);
  return response.subcategories || [];
}

/**
 * Fetch all subcategories for all categories
 */
async function fetchAllSubcategories(categories) {
  const subcategoriesMap = {};

  for (const category of categories) {
    console.log(`📦 Fetching subcategories for: ${category.code}`);
    const subcategories = await fetchSubcategories(category.code);
    subcategoriesMap[category.code] = subcategories;
  }

  return subcategoriesMap;
}

/**
 * Format category object for JavaScript
 */
function formatCategory(category) {
  return `  {
    id: "${category.id}",
    code: "${category.code}",
    name: "${category.name}",
    description: "${category.description || ''}",
    icon: "${category.icon || ''}",
    pricing_type: "${category.pricing_type || 'dynamic'}",
    sort_order: ${category.sort_order || 0},
    requires_tonnage: ${category.requires_tonnage || false},
    requires_engine_capacity: ${category.requires_engine_capacity || false},
    requires_passenger_count: ${category.requires_passenger_count || false},
    requires_passenger_type: ${category.requires_passenger_type || false},
    requires_carrying_capacity: ${category.requires_carrying_capacity || false},
    supports_time_period_variants: ${category.supports_time_period_variants || false},
    min_vehicle_age: ${category.min_vehicle_age || 0},
    max_vehicle_age: ${category.max_vehicle_age || 'null'},
    is_active: ${category.is_active !== false},
  }`;
}

/**
 * Format subcategory object for JavaScript
 */
function formatSubcategory(subcategory, parentCategoryCode) {
  // Sanitize and provide safe fallbacks to avoid "undefined" strings in UI
  const code = String(subcategory.subcategory_code || '').trim();
  const name = String(subcategory.name || '').trim();
  const safeName = name && name.toLowerCase() !== 'undefined' ? name : code;

  const cov = String(subcategory.coverage_type || subcategory.product_type || '').trim();
  const pricing = String(subcategory.pricing_model || '').trim();
  const safeCoverageType = cov && cov.toLowerCase() !== 'undefined' ? cov : (pricing || '');

  const descRaw = subcategory.description;
  const safeDescription = descRaw && String(descRaw).toLowerCase() !== 'undefined' ? String(descRaw) : '';

  // Prefer explicit parent category code to avoid blanks
  const categoryCode = String(
    parentCategoryCode || subcategory.category_code || subcategory.category || ''
  ).trim();
  const safeCategoryCode = categoryCode && categoryCode.toLowerCase() !== 'undefined' ? categoryCode : '';

  const basePremiumVal = (subcategory.base_premium === 0 || subcategory.base_premium) ? subcategory.base_premium : null;

  const safeId = String(subcategory.id || code || `${safeCategoryCode}:${code}`);

  return `    {
      id: "${safeId}",
      category_code: "${safeCategoryCode}",
      subcategory_code: "${code}",
      name: "${safeName}",
      coverage_type: "${safeCoverageType}",
      description: "${safeDescription}",
      pricing_model: "${pricing}",
      base_premium: ${basePremiumVal === null ? 'null' : basePremiumVal},
      is_active: ${subcategory.is_active !== false},
      sort_order: ${subcategory.sort_order || 0},
    }`;
}

/**
 * Generate the static categories file content
 */
function generateFileContent(categories, subcategoriesMap) {
  const now = new Date().toISOString().split('T')[0];
  const version = `1.${Date.now()}`;

  let content = `/**
 * Static Motor Categories and Subcategories
 * 
 * This file contains hardcoded motor insurance categories and subcategories
 * to improve performance in Motor3 (no API calls needed for category selection).
 * 
 * Motor vehicle categories rarely change, so maintaining a static version
 * is more efficient than fetching from API on every session.
 * 
 * VERSION: ${version}
 * LAST_UPDATED: ${now}
 * DATA_SOURCE: Backend MotorCategory and MotorSubcategory models
 * GENERATED_BY: scripts/syncMotorCategories.js
 * 
 * How to update:
 * 1. Run checkCategoryVersion() to detect if backend has changes
 * 2. If changes detected, run npm run sync-motor-categories
 * 3. VERSION and LAST_UPDATED are auto-generated
 */

export const CATEGORY_VERSION = "${version}";
export const LAST_CATEGORY_UPDATE = "${now}";

/**
 * Motor Insurance Categories
 * Matches backend MotorCategory model structure
 */
export const MOTOR_CATEGORIES = [
`;

  // Add categories
  content += categories.map(formatCategory).join(',\n');
  content += '\n];\n\n';

  // Add subcategories
  content += `/**
 * Motor Insurance Subcategories
 * Matches backend MotorSubcategory model structure
 * Organized by category for easy lookup
 */
export const MOTOR_SUBCATEGORIES = {
`;

  const subcategoryEntries = Object.entries(subcategoriesMap).map(([categoryCode, subcategories]) => {
    const formattedSubcategories = subcategories.map((sub) => formatSubcategory(sub, categoryCode)).join(',\n');
    return `  ${categoryCode}: [\n${formattedSubcategories}\n  ]`;
  });

  content += subcategoryEntries.join(',\n');
  content += '\n};\n\n';

  // Add utility functions (keep the same as before)
  content += `/**
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
`;

  return content;
}

/**
 * Main sync function
 */
async function syncCategories() {
  console.log('🚀 Starting Motor Categories Sync...\n');
  console.log(`📡 Backend URL: ${API_BASE_URL}`);
  console.log(`📁 Output File: ${OUTPUT_FILE}\n`);

  try {
    // Fetch categories
    console.log('📦 Fetching categories...');
    const categories = await fetchCategories();
    console.log(`✅ Found ${categories.length} categories\n`);

    // Fetch all subcategories
    console.log('📦 Fetching subcategories...');
    const subcategoriesMap = await fetchAllSubcategories(categories);
    const totalSubcategories = Object.values(subcategoriesMap).flat().length;
    console.log(`✅ Found ${totalSubcategories} total subcategories\n`);

    // Generate file content
    console.log('📝 Generating static file...');
    const fileContent = generateFileContent(categories, subcategoriesMap);

    // Write to file
    fs.writeFileSync(OUTPUT_FILE, fileContent, 'utf8');
    console.log(`✅ File written successfully!\n`);

    // Summary
    console.log('📊 SYNC SUMMARY:');
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Subcategories: ${totalSubcategories}`);
    console.log(`   Output: ${OUTPUT_FILE}`);
    console.log('\n✅ Motor categories synced successfully!');
  } catch (error) {
    console.error('\n❌ Sync failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  syncCategories();
}

module.exports = { syncCategories };
