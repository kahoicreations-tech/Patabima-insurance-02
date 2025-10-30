/**
 * Category Management Examples
 * 
 * This file demonstrates how to easily manage and update categories
 * using the new centralized system.
 */

import { 
  INSURANCE_CATEGORIES, 
  CATEGORY_STATUS, 
  getActiveCategories,
  getCategoryById 
} from './insuranceCategories';

/**
 * Example: Activate Travel Insurance
 * This shows how easy it is to change category status
 */
export const activateTravelInsurance = () => {
  const travelCategory = getCategoryById('travel');
  if (travelCategory) {
    // Simply update the status in the data file
    travelCategory.status = CATEGORY_STATUS.ACTIVE;
    travelCategory.screen = 'TravelQuotation';
    
    console.log('Travel Insurance is now active!');
    return true;
  }
  return false;
};

/**
 * Example: Update Commission Rates
 * Demonstrate bulk updates to business rules
 */
export const updateCommissionRates = (increases = {}) => {
  INSURANCE_CATEGORIES.forEach(category => {
    if (increases[category.id]) {
      const oldRate = category.commissionRate;
      category.commissionRate += increases[category.id];
      console.log(
        `${category.name}: ${(oldRate * 100).toFixed(1)}% → ${(category.commissionRate * 100).toFixed(1)}%`
      );
    }
  });
};

/**
 * Example: Add Seasonal Campaign Features
 * Show how to temporarily modify category data
 */
export const addSeasonalFeatures = () => {
  const motorCategory = getCategoryById('motor-vehicle');
  if (motorCategory) {
    // Add seasonal features
    motorCategory.features.push('🎄 Holiday Discount 20%');
    motorCategory.features.push('🎁 Free Emergency Kit');
    
    // Update description
    motorCategory.description += ' - Special Holiday Offers Available!';
    
    console.log('Seasonal features added to Motor Vehicle insurance');
  }
};

/**
 * Example: Category Analytics Data
 * Demonstrate how easy it is to generate reports
 */
export const generateCategoryReport = () => {
  const report = {
    total: INSURANCE_CATEGORIES.length,
    active: getActiveCategories().length,
    byStatus: {},
    averageCommission: 0,
    totalMinimumPremiums: 0
  };

  // Calculate statistics
  INSURANCE_CATEGORIES.forEach(category => {
    // Count by status
    report.byStatus[category.status] = (report.byStatus[category.status] || 0) + 1;
    
    // Sum for averages
    report.averageCommission += category.commissionRate;
    report.totalMinimumPremiums += category.minimumPremium;
  });

  // Calculate averages
  report.averageCommission = (report.averageCommission / INSURANCE_CATEGORIES.length * 100).toFixed(2);
  report.averageMinimumPremium = Math.round(report.totalMinimumPremiums / INSURANCE_CATEGORIES.length);

  return report;
};

/**
 * Example: Search and Filter Combinations
 * Show the power of the utility functions
 */
export const advancedCategorySearch = (criteria) => {
  let results = INSURANCE_CATEGORIES;

  // Filter by multiple criteria
  if (criteria.status) {
    results = results.filter(cat => cat.status === criteria.status);
  }
  
  if (criteria.minCommission) {
    results = results.filter(cat => cat.commissionRate >= criteria.minCommission);
  }
  
  if (criteria.maxPremium) {
    results = results.filter(cat => cat.minimumPremium <= criteria.maxPremium);
  }
  
  if (criteria.isPopular !== undefined) {
    results = results.filter(cat => cat.isPopular === criteria.isPopular);
  }
  
  if (criteria.hasScreen) {
    results = results.filter(cat => cat.screen !== null);
  }

  return results.map(cat => ({
    id: cat.id,
    name: cat.name,
    status: cat.status,
    commission: `${(cat.commissionRate * 100).toFixed(1)}%`,
    premium: `KES ${cat.minimumPremium.toLocaleString()}`
  }));
};

/**
 * Example Usage:
 * 
 * // Activate travel insurance
 * activateTravelInsurance();
 * 
 * // Give motor insurance a 2% commission boost
 * updateCommissionRates({
 *   'motor-vehicle': 0.02
 * });
 * 
 * // Generate analytics
 * const report = generateCategoryReport();
 * console.log('Category Report:', report);
 * 
 * // Advanced search
 * const highCommissionCategories = advancedCategorySearch({
 *   minCommission: 0.15,
 *   status: 'active'
 * });
 */

export default {
  activateTravelInsurance,
  updateCommissionRates,
  addSeasonalFeatures,
  generateCategoryReport,
  advancedCategorySearch
};
