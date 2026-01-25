/**
 * Premium Calculations for Motor3
 * Mandatory levies and premium computations for Kenyan insurance
 * ITL (Insurance Training Levy), PCF (Policyholders Compensation Fund), Stamp Duty
 */

/**
 * Levy rates (as of 2025)
 * Source: Insurance Regulatory Authority (IRA) Kenya
 */
export const LEVY_RATES = {
  ITL: 0.0025, // 0.25% Insurance Training Levy
  PCF: 0.0025, // 0.25% Policyholders Compensation Fund
  STAMP_DUTY: 40, // KSh 40 fixed stamp duty per policy
};

/**
 * Round to 2 decimal places (for currency)
 */
export function round2(value) {
  return Math.round(value * 100) / 100;
}

/**
 * Calculate Insurance Training Levy (ITL)
 * @param {number} premium - Base premium
 * @returns {number} ITL amount
 */
export function calculateITL(premium) {
  return round2(premium * LEVY_RATES.ITL);
}

/**
 * Calculate Policyholders Compensation Fund (PCF)
 * @param {number} premium - Base premium
 * @returns {number} PCF amount
 */
export function calculatePCF(premium) {
  return round2(premium * LEVY_RATES.PCF);
}

/**
 * Get stamp duty (fixed amount)
 * @returns {number} Stamp duty amount
 */
export function getStampDuty() {
  return LEVY_RATES.STAMP_DUTY;
}

/**
 * Calculate all mandatory levies
 * @param {number} basePremium - Base premium before levies
 * @returns {object} { itl, pcf, stamp_duty, total_levies }
 */
export function calculateLevies(basePremium) {
  const itl = calculateITL(basePremium);
  const pcf = calculatePCF(basePremium);
  const stampDuty = getStampDuty();
  
  return {
    itl,
    pcf,
    stamp_duty: stampDuty,
    total_levies: round2(itl + pcf + stampDuty),
  };
}

/**
 * Calculate total premium (base + levies)
 * @param {number} basePremium 
 * @returns {number} Total premium
 */
export function calculateTotalPremium(basePremium) {
  const levies = calculateLevies(basePremium);
  return round2(basePremium + levies.total_levies);
}

/**
 * Calculate breakdown (base + all levies)
 * @param {number} basePremium 
 * @returns {object} { base, itl, pcf, stamp_duty, total }
 */
export function getPremiumBreakdown(basePremium) {
  const levies = calculateLevies(basePremium);
  
  return {
    base_premium: round2(basePremium),
    itl: levies.itl,
    pcf: levies.pcf,
    stamp_duty: levies.stamp_duty,
    total_premium: round2(basePremium + levies.total_levies),
  };
}

/**
 * Calculate windscreen add-on premium
 * @param {number} windscreenValue - Value of windscreen
 * @param {number} baseRate - Rate from underwriter (default 2.5%)
 * @returns {number} Windscreen premium
 */
export function calculateWindscreenPremium(windscreenValue, baseRate = 0.025) {
  if (!windscreenValue || windscreenValue <= 0) return 0;
  if (windscreenValue > 30000) return 0; // Max KSh 30,000
  
  return round2(windscreenValue * baseRate);
}

/**
 * Calculate radio/cassette add-on premium
 * @param {number} radioValue - Value of radio/cassette
 * @param {number} baseRate - Rate from underwriter (default 2.5%)
 * @returns {number} Radio/cassette premium
 */
export function calculateRadioCassettePremium(radioValue, baseRate = 0.025) {
  if (!radioValue || radioValue < 30000) return 0; // Min KSh 30,000
  
  return round2(radioValue * baseRate);
}

/**
 * Calculate excess protector add-on premium
 * @param {number} basePremium 
 * @param {number} rate - Rate from underwriter (default 10% of base)
 * @returns {number} Excess protector premium
 */
export function calculateExcessProtectorPremium(basePremium, rate = 0.10) {
  return round2(basePremium * rate);
}

/**
 * Calculate PVT (Political Violence & Terrorism) add-on premium
 * @param {number} sumInsured 
 * @param {number} rate - Rate from underwriter (default 0.05%)
 * @returns {number} PVT premium
 */
export function calculatePVTPremium(sumInsured, rate = 0.0005) {
  return round2(sumInsured * rate);
}

/**
 * Calculate loss of use add-on premium
 * @param {number} basePremium 
 * @param {number} rate - Rate from underwriter (default 5% of base)
 * @returns {number} Loss of use premium
 */
export function calculateLossOfUsePremium(basePremium, rate = 0.05) {
  return round2(basePremium * rate);
}

/**
 * Calculate all add-ons total premium
 * @param {object} addons - { windscreen_value, radio_cassette_value, excess_protector, pvt, loss_of_use }
 * @param {number} basePremium 
 * @param {number} sumInsured 
 * @returns {object} { windscreen, radio_cassette, excess_protector, pvt, loss_of_use, total_addons }
 */
export function calculateAddonsPremium(addons, basePremium, sumInsured) {
  const windscreen = addons.windscreen_value 
    ? calculateWindscreenPremium(addons.windscreen_value) 
    : 0;
  
  const radioCassette = addons.radio_cassette_value 
    ? calculateRadioCassettePremium(addons.radio_cassette_value) 
    : 0;
  
  const excessProtector = addons.excess_protector 
    ? calculateExcessProtectorPremium(basePremium) 
    : 0;
  
  const pvt = addons.pvt 
    ? calculatePVTPremium(sumInsured) 
    : 0;
  
  const lossOfUse = addons.loss_of_use 
    ? calculateLossOfUsePremium(basePremium) 
    : 0;
  
  return {
    windscreen,
    radio_cassette: radioCassette,
    excess_protector: excessProtector,
    pvt,
    loss_of_use: lossOfUse,
    total_addons: round2(windscreen + radioCassette + excessProtector + pvt + lossOfUse),
  };
}

/**
 * Calculate instalment amounts (3 or 4 instalments)
 * @param {number} totalPremium 
 * @param {number} numInstalments - 3 or 4
 * @returns {array} Array of instalment amounts
 */
export function calculateInstalments(totalPremium, numInstalments = 3) {
  if (numInstalments === 3) {
    // 40% - 30% - 30%
    const first = round2(totalPremium * 0.40);
    const second = round2(totalPremium * 0.30);
    const third = round2(totalPremium - first - second); // Remainder
    
    return [first, second, third];
  } else if (numInstalments === 4) {
    // 25% - 25% - 25% - 25%
    const instalment = round2(totalPremium * 0.25);
    const last = round2(totalPremium - (instalment * 3)); // Remainder
    
    return [instalment, instalment, instalment, last];
  }
  
  return [totalPremium]; // Fallback: full payment
}

/**
 * Calculate late fee for expired policies (for extensions)
 * @param {number} basePremium 
 * @param {number} daysExpired 
 * @returns {number} Late fee amount
 */
export function calculateLateFee(basePremium, daysExpired) {
  let rate = 0;
  
  if (daysExpired <= 30) {
    rate = 0.05; // 5%
  } else if (daysExpired <= 60) {
    rate = 0.10; // 10%
  } else if (daysExpired <= 90) {
    rate = 0.15; // 15%
  }
  
  return round2(basePremium * rate);
}

/**
 * Calculate prorated premium for extensions
 * @param {number} annualPremium 
 * @param {number} extensionDays - Number of days to extend
 * @returns {number} Prorated premium
 */
export function calculateProratedPremium(annualPremium, extensionDays) {
  const dailyRate = annualPremium / 365;
  return round2(dailyRate * extensionDays);
}

/**
 * Format currency for display
 * @param {number} amount 
 * @returns {string} Formatted currency (e.g., "KSh 3,029.88")
 */
export function formatPremium(amount) {
  // Handle undefined, null, or non-numeric values
  const numericAmount = Number(amount) || 0;
  return `KSh ${numericAmount.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Calculate complete premium with all components
 * @param {object} params - { base_premium, addons, instalment_option }
 * @returns {object} Complete breakdown
 */
export function calculateCompletePremium(params) {
  const { base_premium, addons = {}, sum_insured = 0, instalment_option = null } = params;
  
  // 1. Calculate add-ons
  const addonsBreakdown = calculateAddonsPremium(addons, base_premium, sum_insured);
  
  // 2. Calculate total base (base + add-ons)
  const totalBase = round2(base_premium + addonsBreakdown.total_addons);
  
  // 3. Calculate levies on total base
  const levies = calculateLevies(totalBase);
  
  // 4. Calculate final total
  const finalTotal = round2(totalBase + levies.total_levies);
  
  // 5. Calculate instalments (if applicable)
  const instalments = instalment_option 
    ? calculateInstalments(finalTotal, instalment_option) 
    : null;
  
  return {
    base_premium: round2(base_premium),
    addons: addonsBreakdown,
    total_base: totalBase,
    levies,
    total_premium: finalTotal,
    instalments,
  };
}
