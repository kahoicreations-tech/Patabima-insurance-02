// Simple diagnostic script to verify category/product coverage.
// Run with: node scripts/diagnoseProducts.js

function runDiagnostics() {
  try {
    const { INSURANCE_PRODUCTS } = require('../backend/config/insuranceProducts.js');
    const { INSURANCE_CATEGORIES } = require('../backend/config/categories.js');
    const categoryKeys = new Set(INSURANCE_CATEGORIES.map(c => c.key));
    const productsByCategory = {};
    for (const c of categoryKeys) productsByCategory[c] = [];
    for (const p of INSURANCE_PRODUCTS) {
      productsByCategory[p.category] = productsByCategory[p.category] || [];
      productsByCategory[p.category].push(p.code);
    }
    const missing = [...categoryKeys].filter(k => !productsByCategory[k] || productsByCategory[k].length === 0);
    console.log('Category Representation Summary');
    console.log('--------------------------------');
    for (const k of categoryKeys) {
      console.log(`${k}: ${productsByCategory[k]?.length || 0} product(s)`);
    }
    if (missing.length) {
      console.log('\nMissing Product Coverage For Categories:', missing.join(', '));
    } else {
      console.log('\nAll categories have at least one product.');
    }
  } catch (e) {
    console.error('Diagnostics failed:', e);
    process.exitCode = 1;
  }
}

runDiagnostics();
