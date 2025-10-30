/**
 * Motor Insurance Add-on Calculation Service
 * 
 * Handles premium calculations for comprehensive motor insurance add-ons
 * with underwriter-specific rates, minimum premiums, and business rules.
 */

class AddonCalculationService {
  /**
   * Standard add-ons configuration for comprehensive motor insurance
   */
  static getStandardAddons() {
    return [
      {
        id: "excess_protector",
        name: "Excess Protector",
        description: "Covers the excess amount in case of a claim",
        pricing_type: "PERCENTAGE",
        base_rate: 0.0025, // 0.25%
        minimum_premium: 3000,
        calculation_base: "sum_insured",
        applicable_to: ["COMPREHENSIVE"],
        category: "protection",
      },
      {
        id: "political_violence_terrorism",
        name: "Political Violence & Terrorism (PVT)",
        description: "Covers damage from political violence and terrorism",
        pricing_type: "PERCENTAGE",
        base_rate: 0.0025, // 0.25%
        minimum_premium: 2500,
        calculation_base: "sum_insured",
        applicable_to: ["COMPREHENSIVE"],
        category: "protection",
      },
      {
        id: "loss_of_use",
        name: "Loss of Use",
        description: "Daily compensation when vehicle is being repaired",
        pricing_type: "FIXED",
        base_rate: 3000,
        maximum_limit: 30000,
        calculation_base: "fixed",
        applicable_to: ["COMPREHENSIVE"],
        category: "benefits",
      },
      {
        id: "windscreen_cover",
        name: "Windscreen Cover",
        description: "Extended windscreen replacement coverage",
        pricing_type: "PERCENTAGE",
        base_rate: 0.1, // 10%
        minimum_value_threshold: 30000,
        calculation_base: "windscreen_value",
        conditional: true, // Only if windscreen_value > threshold
        applicable_to: ["COMPREHENSIVE"],
        category: "accessories",
      },
      {
        id: "radio_cover",
        name: "Radio/Cassette Cover",
        description: "Audio system replacement coverage",
        pricing_type: "PERCENTAGE",
        base_rate: 0.1, // 10%
        minimum_value_threshold: 30000,
        calculation_base: "radio_cassette_value",
        conditional: true, // Only if radio_value > threshold
        applicable_to: ["COMPREHENSIVE"],
        category: "accessories",
      },
      {
        id: "accessories_cover",
        name: "Other Accessories Cover",
        description: "Covers additional fitted accessories",
        pricing_type: "PERCENTAGE",
        base_rate: 0.1, // default fallback; underwriter/backend may override
        // No fixed threshold by default; applicable when accessories value > 0
        minimum_value_threshold: 0,
        calculation_base: "vehicle_accessories_value",
        conditional: true,
        applicable_to: ["COMPREHENSIVE"],
        category: "accessories",
      },
    ];
  }

  /**
   * Filter add-ons based on coverage type and vehicle data
   * @param {string} coverageType - Type of coverage (COMPREHENSIVE, THIRD_PARTY, etc.)
   * @param {Object} vehicleData - Vehicle details including values
   * @returns {Array} Filtered and applicable add-ons
   */
  static getApplicableAddons(coverageType, vehicleData = {}) {
    const allAddons = this.getStandardAddons();
    
    return allAddons.filter(addon => {
      // Check if addon applies to this coverage type
      if (!addon.applicable_to.includes(coverageType)) {
        return false;
      }

      // For conditional add-ons, check if conditions are met
      if (addon.conditional) {
        const baseValue = vehicleData[addon.calculation_base] || 0;
        const threshold = addon.minimum_value_threshold || 0;
        
        // Only show conditional add-ons if the base value exceeds threshold
        return baseValue > threshold;
      }

      return true;
    });
  }

  /**
   * Calculate premium for a single add-on
   * @param {Object} addon - Add-on configuration
   * @param {Object} vehicleData - Vehicle data with values
   * @param {Object} underwriter - Underwriter configuration
   * @returns {Object} Calculation result
   */
  static calculateAddonPremium(addon, vehicleData, underwriter = null) {
    const { sum_insured, windscreen_value, radio_cassette_value, vehicle_accessories_value, other_accessories_value } = vehicleData;

    // Get underwriter-specific rate or use default
    const underwriterRate = underwriter?.features?.addon_rates?.[addon.id] || addon.base_rate;

    let calculationBase = 0;
    let premium = 0;
    let calculation_details = "";

    switch (addon.calculation_base) {
      case "sum_insured":
        calculationBase = sum_insured || 0;
        premium = calculationBase * underwriterRate;
        calculation_details = `${(underwriterRate * 100).toFixed(2)}% × ${this.formatCurrency(calculationBase)}`;
        break;

      case "windscreen_value":
        calculationBase = windscreen_value || 0;
        if (calculationBase > (addon.minimum_value_threshold || 0)) {
          premium = calculationBase * underwriterRate;
          calculation_details = `${(underwriterRate * 100).toFixed(1)}% × ${this.formatCurrency(calculationBase)}`;
        } else {
          calculation_details = `Value below threshold (${this.formatCurrency(addon.minimum_value_threshold || 0)})`;
        }
        break;

      case "radio_cassette_value":
        calculationBase = radio_cassette_value || 0;
        if (calculationBase > (addon.minimum_value_threshold || 0)) {
          premium = calculationBase * underwriterRate;
          calculation_details = `${(underwriterRate * 100).toFixed(1)}% × ${this.formatCurrency(calculationBase)}`;
        } else {
          calculation_details = `Value below threshold (${this.formatCurrency(addon.minimum_value_threshold || 0)})`;
        }
        break;

      case "vehicle_accessories_value":
      case "other_accessories_value":
        calculationBase = (vehicle_accessories_value ?? other_accessories_value) || 0;
        if (calculationBase > (addon.minimum_value_threshold || 0)) {
          premium = calculationBase * underwriterRate;
          calculation_details = `${(underwriterRate * 100).toFixed(1)}% × ${this.formatCurrency(calculationBase)}`;
        } else {
          calculation_details = `Value below threshold (${this.formatCurrency(addon.minimum_value_threshold || 0)})`;
        }
        break;

      case "fixed":
        premium = underwriterRate;
        calculation_details = `Fixed amount`;
        break;

      default:
        calculation_details = "Unknown calculation base";
    }

    // Apply minimum premium if specified
    const originalPremium = premium;
    if (addon.minimum_premium && premium > 0 && premium < addon.minimum_premium) {
      premium = addon.minimum_premium;
      calculation_details += `, minimum ${this.formatCurrency(addon.minimum_premium)} applied`;
    }

    // Apply maximum limit if specified
    if (addon.maximum_limit && premium > addon.maximum_limit) {
      premium = addon.maximum_limit;
      calculation_details += `, capped at ${this.formatCurrency(addon.maximum_limit)}`;
    }

    // Get underwriter-specific minimum premium
    const underwriterMinimum = underwriter?.features?.minimum_premiums?.[addon.id];
    if (underwriterMinimum && premium > 0 && premium < underwriterMinimum) {
      premium = underwriterMinimum;
      calculation_details += `, underwriter minimum ${this.formatCurrency(underwriterMinimum)} applied`;
    }

    return {
      addon_id: addon.id,
      addon_name: addon.name,
      base_value: calculationBase,
      rate_applied: underwriterRate,
      original_premium: originalPremium,
      calculated_premium: Math.round(premium),
      calculation_details,
      is_applicable: premium > 0,
      is_conditional: addon.conditional || false,
      category: addon.category,
    };
  }

  /**
   * Calculate total premium for multiple selected add-ons
   * @param {Array} selectedAddons - Array of selected add-on objects
   * @param {Object} vehicleData - Vehicle data
   * @param {Object} underwriter - Underwriter configuration
   * @returns {Object} Total calculation with breakdown
   */
  static calculateTotalAddonsPremium(selectedAddons, vehicleData, underwriter = null) {
    if (!Array.isArray(selectedAddons) || selectedAddons.length === 0) {
      return {
        total: 0,
        breakdown: [],
        summary: {
          protection: 0,
          benefits: 0,
          accessories: 0,
        },
      };
    }

    let total = 0;
    const breakdown = [];
    const summary = {
      protection: 0,
      benefits: 0,
      accessories: 0,
    };

    selectedAddons.forEach((addon) => {
      const calculation = this.calculateAddonPremium(addon, vehicleData, underwriter);
      
      if (calculation.is_applicable && calculation.calculated_premium > 0) {
        total += calculation.calculated_premium;
        breakdown.push(calculation);
        
        // Add to category summary
        if (summary.hasOwnProperty(calculation.category)) {
          summary[calculation.category] += calculation.calculated_premium;
        }
      }
    });

    return {
      total: Math.round(total),
      breakdown,
      summary,
      underwriter_name: underwriter?.company_name || "Default",
      calculation_timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get underwriter-specific add-on rates
   * @param {Object} underwriter - Underwriter configuration
   * @returns {Object} Add-on rates and minimums
   */
  static getUnderwriterAddonRates(underwriter) {
    if (!underwriter?.features) {
      return {
        addon_rates: {},
        minimum_premiums: {},
      };
    }

    return {
      addon_rates: underwriter.features.addon_rates || {},
      minimum_premiums: underwriter.features.minimum_premiums || {},
    };
  }

  /**
   * Compare add-on pricing across multiple underwriters
   * @param {Array} selectedAddons - Selected add-ons
   * @param {Object} vehicleData - Vehicle data
   * @param {Array} underwriters - Array of underwriter configurations
   * @returns {Object} Comparison results
   */
  static compareAddonPricingAcrossUnderwriters(selectedAddons, vehicleData, underwriters) {
    if (!Array.isArray(underwriters) || underwriters.length === 0) {
      return { comparisons: [], lowest_total: null, highest_total: null };
    }

    const comparisons = underwriters.map(underwriter => {
      const calculation = this.calculateTotalAddonsPremium(selectedAddons, vehicleData, underwriter);
      return {
        underwriter_code: underwriter.company_code || underwriter.code,
        underwriter_name: underwriter.company_name || underwriter.name,
        ...calculation,
      };
    });

    // Find lowest and highest totals
    const totals = comparisons.map(c => c.total).filter(t => t > 0);
    const lowest_total = totals.length > 0 ? Math.min(...totals) : 0;
    const highest_total = totals.length > 0 ? Math.max(...totals) : 0;

    return {
      comparisons,
      lowest_total,
      highest_total,
      savings_available: highest_total - lowest_total,
    };
  }

  /**
   * Format currency for display
   * @param {number} amount - Amount to format
   * @returns {string} Formatted currency string
   */
  static formatCurrency(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return 'KSh 0';
    }
    return `KSh ${amount.toLocaleString()}`;
  }

  /**
   * Validate vehicle data for add-ons compatibility
   * @param {Object} vehicleData - Vehicle data
   * @returns {Object} Validation result
   */
  static validateVehicleDataForAddons(vehicleData) {
    const errors = [];
    const warnings = [];

    if (!vehicleData) {
      errors.push({ message: 'Vehicle data is required for add-ons' });
      return { isValid: false, errors, warnings };
    }

    if (!vehicleData.sum_insured || vehicleData.sum_insured <= 0) {
      errors.push({ message: 'Sum insured is required for add-on calculations' });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate add-on selection based on vehicle data
   * @param {Array} selectedAddons - Selected add-ons
   * @param {Object} vehicleData - Vehicle data
   * @returns {Object} Validation result with errors
   */
  static validateAddonSelection(selectedAddons, vehicleData) {
    const errors = [];
    const warnings = [];

    selectedAddons.forEach(addon => {
      if (addon.conditional) {
        const baseValue = vehicleData[addon.calculation_base] || 0;
        const threshold = addon.minimum_value_threshold || 0;

        if (baseValue <= threshold) {
          errors.push({
            addon_id: addon.id,
            message: `${addon.name} requires ${addon.calculation_base.replace('_', ' ')} value above ${this.formatCurrency(threshold)}`,
          });
        }
      }

      // Check for reasonable values
      if (addon.calculation_base === 'windscreen_value' && vehicleData.windscreen_value > 200000) {
        warnings.push({
          addon_id: addon.id,
          message: `Windscreen value seems unusually high (${this.formatCurrency(vehicleData.windscreen_value)})`,
        });
      }

      if (addon.calculation_base === 'radio_cassette_value' && vehicleData.radio_cassette_value > 150000) {
        warnings.push({
          addon_id: addon.id,
          message: `Radio/Cassette value seems unusually high (${this.formatCurrency(vehicleData.radio_cassette_value)})`,
        });
      }
    });

    return {
      is_valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

export default AddonCalculationService;