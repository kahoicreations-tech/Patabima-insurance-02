// Motor2 Endpoint Sweep
import fetch from 'node-fetch';

const BASE = 'http://127.0.0.1:8000';

const qs = (obj) =>
  Object.entries(obj)
    .filter(([_, v]) => v !== undefined && v !== null && `${v}`.length > 0)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

async function call(url, method = 'GET', body) {
  const full = url.startsWith('http') ? url : `${BASE}${url}`;
  const options = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) options.body = typeof body === 'string' ? body : JSON.stringify(body);
  const res = await fetch(full, options);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { _nonJson: text.slice(0, 300) }; }
  return { status: res.status, ok: res.ok, json };
}

async function main() {
  const out = {};

  // Categories
  out.categories = await call('/api/v1/motor/categories/');

  // PRIVATE sweep
  out.subcategories_PRIVATE = await call('/api/v1/motor/subcategories/?' + qs({ category: 'PRIVATE' }));
  out.covertype_PRIVATE = await call('/api/v1/motor/cover-types/?' + qs({ category: 'PRIVATE' }));
  out.fields_PRIVATE_TP = await call('/api/v1/motor/field-requirements/?' + qs({ category: 'PRIVATE', subcategory_code: 'PRIVATE_THIRD_PARTY', cover_type: 'PRIVATE_THIRD_PARTY' }));

  // Addons endpoint (public)
  out.addons_PRIVATE_TP = await call('/api/v1/public_app/insurance/addons?' + qs({ category: 'PRIVATE', subcategory_code: 'PRIVATE_THIRD_PARTY' }));

  // Calculate - sample payloads
  out.calc_PRIVATE_TP = await call('/api/v1/public_app/insurance/calculate_motor_premium', 'POST', {
    category: 'PRIVATE',
    subcategory_code: 'PRIVATE_THIRD_PARTY',
    cover_type: 'THIRD_PARTY',
    vehicle_make: 'Toyota',
    vehicle_model: 'Axio',
    vehicle_year: 2020,
  });

  out.calc_PRIVATE_TOR = await call('/api/v1/public_app/insurance/calculate_motor_premium', 'POST', {
    category: 'PRIVATE',
    subcategory_code: 'PRIVATE_TOR',
    cover_type: 'TOR',
    vehicle_make: 'Toyota',
    vehicle_model: 'Axio',
    vehicle_year: 2020,
    duration_days: 30,
  });

  // Compare - PRIVATE TP
  out.compare_PRIVATE_TP = await call('/api/v1/public_app/insurance/compare_motor_pricing', 'POST', {
    category: 'PRIVATE',
    subcategory_code: 'PRIVATE_THIRD_PARTY',
    cover_type: 'THIRD_PARTY',
    vehicle_make: 'Toyota',
    vehicle_model: 'Axio',
    vehicle_year: 2020,
    registration_number: 'KCA123A',
  });

  // Underwriters discovery (correct path)
  out.underwriters_PRIVATE = await call('/api/v1/public_app/insurance/get_underwriters?' + qs({ category_code: 'PRIVATE' }));
  out.underwriters_PRIVATE_TP = await call('/api/v1/public_app/insurance/get_underwriters?' + qs({ category_code: 'PRIVATE', subcategory_code: 'PRIVATE_THIRD_PARTY' }));
  out.underwriters_PRIVATE_TOR = await call('/api/v1/public_app/insurance/get_underwriters?' + qs({ category_code: 'PRIVATE', subcategory_code: 'PRIVATE_TOR' }));

  // COMMERCIAL brief
  out.subcategories_COMMERCIAL = await call('/api/v1/motor/subcategories/?' + qs({ category: 'COMMERCIAL' }));
  out.covertype_COMMERCIAL = await call('/api/v1/motor/cover-types/?' + qs({ category: 'COMMERCIAL' }));

  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
