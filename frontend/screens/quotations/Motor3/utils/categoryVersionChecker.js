/**
 * Category Version Checker
 * 
 * Checks if the static Motor3 categories are out of sync with the backend.
 * Run this periodically or in development to detect when categories need updating.
 * 
 * Usage:
 *   import { checkCategoryVersion } from './categoryVersionChecker';
 *   const result = await checkCategoryVersion();
 *   if (!result.isUpToDate) {
 *     console.log('Categories need updating!', result.differences);
 *   }
 */

import djangoAPI from '../../../../services/DjangoAPIService';
import { 
  CATEGORY_VERSION, 
  LAST_CATEGORY_UPDATE, 
  MOTOR_CATEGORIES, 
  MOTOR_SUBCATEGORIES,
  getAllSubcategories 
} from '../constants/staticCategories';

/**
 * Fetch current categories from backend
 */
const fetchBackendCategories = async () => {
  try {
    const response = await djangoAPI.makeRequest('/api/v1/motor2/categories/');
    return response.categories || [];
  } catch (error) {
    console.error('[VersionChecker] Failed to fetch backend categories:', error);
    throw new Error('Unable to fetch backend categories');
  }
};

/**
 * Fetch current subcategories from backend
 */
const fetchBackendSubcategories = async () => {
  try {
    // Fetch all subcategories across all categories
    const allSubcategories = [];
    
    for (const category of MOTOR_CATEGORIES) {
      const response = await djangoAPI.makeRequest(
        `/api/v1/motor2/subcategories/?category=${category.code}`
      );
      
      if (response.subcategories) {
        allSubcategories.push(...response.subcategories);
      }
    }
    
    return allSubcategories;
  } catch (error) {
    console.error('[VersionChecker] Failed to fetch backend subcategories:', error);
    throw new Error('Unable to fetch backend subcategories');
  }
};

/**
 * Compare two category/subcategory lists and find differences
 */
const findDifferences = (staticList, backendList, idField = 'code') => {
  const differences = {
    added: [],
    removed: [],
    modified: [],
  };

  const staticMap = new Map(staticList.map((item) => [item[idField], item]));
  const backendMap = new Map(backendList.map((item) => [item[idField], item]));

  // Find added items (in backend but not in static)
  backendList.forEach((backendItem) => {
    if (!staticMap.has(backendItem[idField])) {
      differences.added.push(backendItem);
    }
  });

  // Find removed items (in static but not in backend)
  staticList.forEach((staticItem) => {
    if (!backendMap.has(staticItem[idField])) {
      differences.removed.push(staticItem);
    }
  });

  // Find modified items (different properties)
  staticList.forEach((staticItem) => {
    const backendItem = backendMap.get(staticItem[idField]);
    
    if (backendItem) {
      // Compare key properties (ignore timestamps, UUIDs)
      const propsToCompare = ['name', 'description', 'pricing_model', 'is_active', 'sort_order'];
      let hasChanges = false;
      const changes = {};

      propsToCompare.forEach((prop) => {
        if (staticItem[prop] !== backendItem[prop]) {
          hasChanges = true;
          changes[prop] = {
            static: staticItem[prop],
            backend: backendItem[prop],
          };
        }
      });

      if (hasChanges) {
        differences.modified.push({
          [idField]: staticItem[idField],
          changes,
        });
      }
    }
  });

  return differences;
};

/**
 * Check if static categories are up to date with backend
 * 
 * @returns {Promise<object>} Result object with version info and differences
 */
export const checkCategoryVersion = async () => {
  console.log('[VersionChecker] Checking category version...');
  console.log(`[VersionChecker] Static version: ${CATEGORY_VERSION} (${LAST_CATEGORY_UPDATE})`);

  try {
    // Fetch backend data
    const backendCategories = await fetchBackendCategories();
    const backendSubcategories = await fetchBackendSubcategories();

    // Compare categories
    const categoryDifferences = findDifferences(
      MOTOR_CATEGORIES,
      backendCategories,
      'code'
    );

    // Compare subcategories
    const staticSubcategories = getAllSubcategories();
    const subcategoryDifferences = findDifferences(
      staticSubcategories,
      backendSubcategories,
      'subcategory_code'
    );

    // Calculate if up to date
    const categoriesUpToDate = (
      categoryDifferences.added.length === 0 &&
      categoryDifferences.removed.length === 0 &&
      categoryDifferences.modified.length === 0
    );

    const subcategoriesUpToDate = (
      subcategoryDifferences.added.length === 0 &&
      subcategoryDifferences.removed.length === 0 &&
      subcategoryDifferences.modified.length === 0
    );

    const isUpToDate = categoriesUpToDate && subcategoriesUpToDate;

    const result = {
      isUpToDate,
      staticVersion: CATEGORY_VERSION,
      lastUpdate: LAST_CATEGORY_UPDATE,
      categoriesUpToDate,
      subcategoriesUpToDate,
      differences: {
        categories: categoryDifferences,
        subcategories: subcategoryDifferences,
      },
      summary: {
        totalCategories: {
          static: MOTOR_CATEGORIES.length,
          backend: backendCategories.length,
        },
        totalSubcategories: {
          static: staticSubcategories.length,
          backend: backendSubcategories.length,
        },
        changesDetected: {
          categories: 
            categoryDifferences.added.length +
            categoryDifferences.removed.length +
            categoryDifferences.modified.length,
          subcategories:
            subcategoryDifferences.added.length +
            subcategoryDifferences.removed.length +
            subcategoryDifferences.modified.length,
        },
      },
    };

    // Log summary
    if (isUpToDate) {
      console.log('[VersionChecker] ✅ Static categories are up to date!');
    } else {
      console.warn('[VersionChecker] ⚠️ Static categories are OUT OF DATE!');
      console.warn('[VersionChecker] Changes detected:', result.summary.changesDetected);
    }

    return result;
  } catch (error) {
    console.error('[VersionChecker] Version check failed:', error);
    return {
      isUpToDate: null,
      error: error.message,
      staticVersion: CATEGORY_VERSION,
      lastUpdate: LAST_CATEGORY_UPDATE,
    };
  }
};

/**
 * Format version check result for display
 */
export const formatVersionCheckResult = (result) => {
  if (result.error) {
    return `❌ Version check failed: ${result.error}`;
  }

  if (result.isUpToDate) {
    return `✅ Categories up to date (v${result.staticVersion}, last updated: ${result.lastUpdate})`;
  }

  let message = `⚠️ Categories OUT OF DATE (v${result.staticVersion}, last updated: ${result.lastUpdate})\n\n`;

  // Categories changes
  if (!result.categoriesUpToDate) {
    message += `📦 CATEGORIES:\n`;
    message += `  - Added: ${result.differences.categories.added.length}\n`;
    message += `  - Removed: ${result.differences.categories.removed.length}\n`;
    message += `  - Modified: ${result.differences.categories.modified.length}\n`;
  }

  // Subcategories changes
  if (!result.subcategoriesUpToDate) {
    message += `📦 SUBCATEGORIES:\n`;
    message += `  - Added: ${result.differences.subcategories.added.length}\n`;
    message += `  - Removed: ${result.differences.subcategories.removed.length}\n`;
    message += `  - Modified: ${result.differences.subcategories.modified.length}\n`;
  }

  message += `\n💡 Run: npm run sync-motor-categories to update static data`;

  return message;
};

/**
 * Show version check alert in app (for development)
 */
export const showVersionCheckAlert = async () => {
  const result = await checkCategoryVersion();
  const message = formatVersionCheckResult(result);
  
  if (global.alert) {
    alert(message);
  } else {
    console.log(message);
  }
  
  return result;
};

/**
 * Auto-check version in development mode
 * Call this in Motor3 entry point during development
 */
export const autoCheckVersionInDev = async () => {
  if (
    __DEV__ &&
    // Allow disabling via env: EXPO_PUBLIC_DISABLE_MOTOR3_VERSION_CHECK=true
    String(process.env.EXPO_PUBLIC_DISABLE_MOTOR3_VERSION_CHECK || '').toLowerCase() !== 'true'
  ) {
    console.log('[VersionChecker] Running auto-check in development mode...');
    
    try {
      const result = await checkCategoryVersion();
      
      if (!result.isUpToDate && result.summary) {
        const totalChanges = 
          result.summary.changesDetected.categories +
          result.summary.changesDetected.subcategories;
        
        if (totalChanges > 0) {
          console.warn(
            `[VersionChecker] ⚠️ ${totalChanges} changes detected! ` +
            `Consider running: npm run sync-motor-categories`
          );
        }
      }
    } catch (error) {
      console.warn('[VersionChecker] Auto-check failed (non-critical):', error.message);
    }
  }
};

export default {
  checkCategoryVersion,
  formatVersionCheckResult,
  showVersionCheckAlert,
  autoCheckVersionInDev,
};
