// Dynamic validation utilities for motor insurance
import { PRODUCT_TYPES, VALIDATION_RULES } from '../constants/motorInsuranceConfig';

export function validateField(name, value, rules) {
  const r = rules?.[name];
  if (!r) return null;
  if (r.required && (value === undefined || value === null || String(value).trim() === '')) {
    return 'Required';
  }
  if (r.min != null && Number(value) < r.min) return `Must be >= ${r.min}`;
  if (r.max != null && Number(value) > r.max) return `Must be <= ${r.max}`;
  return null;
}

export function validatePricingInputs(productType, inputs) {
  const errors = {};
  const common = VALIDATION_RULES.common;
  for (const k of Object.keys(common)) {
    const e = validateField(k, inputs[k], { [k]: common[k] });
    if (e) errors[k] = e;
  }
  const typeRules = VALIDATION_RULES[productType] || {};
  for (const k of Object.keys(typeRules)) {
    const e = validateField(k, inputs[k], { [k]: typeRules[k] });
    if (e) errors[k] = e;
  }
  return errors;
}

export function isFormValid(errors) {
  return !errors || Object.keys(errors).length === 0;
}
