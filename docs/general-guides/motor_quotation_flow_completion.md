# Motor 2 Flow → Backend Completion Guide

This note documents exactly what’s missing or incomplete in the new Motor 2 quotation flow to make it fully work end‑to‑end with the Django backend, and what to add/change. It’s based on the code under `frontend/screens/quotations/Motor 2/MotorInsuranceFlow` and the service layer `frontend/services/DjangoAPIService.js` and `frontend/services/MotorInsurancePricingService.js`.

## TL;DR checklist

- [ ] Categories: ensure `/api/v1/motor/categories` exists and returns `{ categories: [...] }` in the shape used by the UI; confirm LAN dev base URL works.
- [ ] Cover types: implement `/api/v1/motor/cover-types?category=PRIVATE` returning `cover_types` list with fields used in UI.
- [ ] Field requirements: implement `/api/v1/motor/field-requirements?category=...&cover_type=...` used for dynamic forms, or adjust client to fixed fields.
- [ ] Premium calculation: ensure `/api/v1/public_app/insurance/calculate_motor_premium` accepts Motor 2 payload (transform in `pricingCalculations.transformPricingRequest`) and returns normalized totals.
- [ ] Underwriter comparison: ensure `/api/v1/public_app/insurance/compare_motor_pricing` accepts `{ category, cover_type, subcategory_code, ... }` and yields `comparisons[]` with per‑underwriter result/breakdown.
- [ ] Documents upload: wire `DocumentsUpload` to `djangoAPI.uploadDocument` and persist opaque handles/URLs to quotation payload.
- [ ] Payment: call `djangoAPI.initiatePayment` and `getPaymentStatus`; persist payment reference in context; gate submission on confirmed status.
- [ ] Submission: call `djangoAPI.submitMotorInsuranceForm` with selected underwriter + client details + docs; then optionally `issuePolicy` once paid.
- [ ] Validation: tighten `motorInsuranceValidation` for each cover type; block Next appropriately at each step.
- [ ] State wiring: persist chosen underwriter, addons premiums, documents, and payment method in `MotorInsuranceContext` and use them in submission payload.

---

## Current flow mapping vs backend

Screens are orchestrated in `MotorInsuranceScreen.js`:

- Steps (comprehensive): Category → Subcategory → Vehicle Details → Underwriters → Add‑ons → Client Details → Payment → Submission
- Steps (non‑comprehensive): Category → Subcategory → Vehicle Details → Documents → Client Details → Payment → Submission

Key integration points already present:

- Categories: loaded via `motorPricingService.getCategories()` → `djangoAPI.getMotorCategories()`
- Cover types: `djangoAPI.getCoverTypes(categoryCode)` used in two places; component curates list.
- Vehicle form: `DynamicVehicleForm` collects required fields and triggers `motorPricingService.compareUnderwritersByCoverType()` as soon as form is minimally ready.
- Underwriters: `UnderwriterSelectionStep` displays comparison results returned by `motorPricingService.compareUnderwritersByCoverType()`.
- Pricing inputs: `DynamicPricingForm` calls `motorPricingService.calculatePremium()` for live totals.
- Add‑ons: managed via `AddonCalculationService`; totals combined in UI (but not yet merged into backend payload).
- Client details: `EnhancedClientForm` captured.
- Payment UI: `EnhancedPayment` renders summary and allows choosing method (no API call yet here).

Service layer readiness:

- `DjangoAPIService` already has robust discovery for:
  - Motor categories: `getMotorCategories()` (multiple fallbacks).
  - Cover types: `getCoverTypes(categoryCode)` expects new `/api/v1/motor/cover-types`.
  - Field requirements: `getFieldRequirements(category, coverType)` expects `/api/v1/motor/field-requirements`.
  - Premium calculation: `calculateMotorPremium(payload)` hitting public_app endpoints.
  - Compare pricing: `compareMotorPricing(payload)` public_app.
  - Underwriters list: `getUnderwriters(params)` with query filters.
  - Documents: `uploadDocument(payload)`; needs to be used from Documents step.
  - Payments: `initiatePayment({ amount, method, phone })`, `getPaymentStatus(reference)`.
  - Policy issue: `issuePolicy(quotation_id)`.

## Gaps and what to add

1. Categories and Cover Types

- Backend
  - Implement endpoints (or add serializers) returning shapes expected by UI:
    - GET `/api/v1/motor/categories` → `{ categories: [{ key, title, desc, icon, category_code, subcategories: [...] }] }`
    - GET `/api/v1/motor/cover-types?category=PRIVATE` → `{ cover_types: [{ id, code, name, cover_type, description, has_fixed_premium, min_sum_insured, max_sum_insured, requires_tonnage, requires_passenger_count, requires_vehicle_valuation }] }`
  - If not ready, adjust client to use older public endpoints temporarily.
- Frontend
  - Confirm `MotorInsuranceScreen` normalizes backend payload into the grid cards. It already maps `categories` via `formattedCategories`.

2. Field Requirements API (optional but recommended)

- Backend
  - Provide GET `/api/v1/motor/field-requirements?category=...&cover_type=...` listing fields with types, required flags, and constraints.
- Frontend
  - `motorPricingService.getPricingForSubcategory` is unused in Motor 2; either wire it to `DynamicVehicleForm` and `DynamicPricingForm`, or keep curated fields for now.

3. Underwriter Comparison wiring

- Frontend
  - `DynamicVehicleForm` auto‑calls `compareUnderwritersByCoverType(category, coverType, formData)` once minimal inputs are present. Good.
  - Ensure `onUnderwriterSelection` bubbles the chosen underwriter back into `MotorInsuranceContext.actions.setSelectedUnderwriter` and is used in the payment and submission payloads.
- Backend response contract expected by UI (via normalization in service):
  - `comparisons: [ { result: { underwriter_id, underwriter_code, underwriter_name, base_premium, total_premium, breakdown:{ base, training_levy, pcf_levy, stamp_duty }, features:{ pricing, addon_rates, minimum_premiums } } } ]`

4. Premium calculation contract

- Frontend sends by `pricingCalculations.transformPricingRequest(productType, inputs)` minimal fields:
  - Always: `category`, `subcategory_code`, `cover_type`, optionally `underwriter_code`, `vehicle_registration`, `cover_start_date`, `policy_term_months` or `duration_days`.
  - For comprehensive/others: `sum_insured`, `vehicle_year`, `tonnage`, `passenger_count`, and add_ons flags if present.
- Backend should return fields consumed in `normalizePricingResponse`:
  - `total_premium`, `base_premium`, `training_levy`, `pcf_levy`, `stamp_duty`, optionally `premium_breakdown`.
  - If breakdown.base*premium is wrong, client repairs using `features.pricing["{CATEGORY}*{COVER}"]` base_premium. Prefer fixing backend breakdown.

5. Documents upload step – missing API call

- Frontend: `DocumentsUpload` collects file metadata but doesn’t call backend.
- Action:
  - Add calls to `djangoAPI.uploadDocument(formData)` for each picked doc:
    - Construct FormData payload when switching service to multipart if backend expects file streams.
    - Save returned `document_id` or URL in context at `state.pricingInputs.documents`.
  - If backend only accepts document URLs/IDs on quote submission, skip immediate upload and attach later.

6. Payment step – missing API integration and gating

- Frontend: `EnhancedPayment` displays summary, allows selecting payment method, but doesn’t initiate payment.
- Action:
  - On Next from Payment step:
    - Call `djangoAPI.initiatePayment({ amount: totalPayable, method, phone })`.
    - Store `{ payment_reference, checkout_request_id, status }` in context.
    - Poll `getPaymentStatus(reference)` every 3–5s until status is `CONFIRMED` or `FAILED` (with 90s timeout).
    - Block progression to Submission until `CONFIRMED`.
  - Persist payment method into `state.pricingInputs.paymentMethod` (already wired) and `state.paymentConfirmed` when confirmed.

7. Submission step – call backend to create quotation and optionally issue policy

- Frontend: Placeholder text only.
- Action:
  - Build submission payload in `MotorInsuranceContext.actions.submitQuotation` (or a new `finalizeAndSubmit`):
    - Vehicle: identificationType, registrationNumber, make, model, year, cover_start_date, category, subcategory_code, cover_type
    - Pricing inputs: sum_insured, tonnage/passengers as applicable, selected add‑ons and totals
    - Underwriter: id/code/name, pricing totals
    - Client: full_name, phone, email, kra_pin, address
    - Documents: array of `{ key, document_id, name, url }`
    - Payment: `{ method, payment_reference, amount_paid }`
  - Call `djangoAPI.submitMotorInsuranceForm(payload)`; persist quotation_id from response.
  - If backend requires explicit issuance after payment, call `djangoAPI.issuePolicy(quotation_id)` and navigate to a receipt screen.

8. Add‑ons → totals into payment summary and submission

- Frontend currently calculates add‑ons via `AddonCalculationService`, but payment and submission payloads don’t merge them.
- Action:
  - Merge `addonsPremium` into payment total at Payment step.
  - Include `selectedAddons` and `addonsBreakdown` in submission payload under `add_ons`.

9. Validation and step gating

- Tighten `canProceed()` logic in `MotorInsuranceScreen.js`:
  - Vehicle Details: ensure all required per coverage/category are present.
  - Underwriters: require `state.selectedUnderwriter` for comprehensive.
  - Documents: if any mandatory docs by coverage/category, require them or allow defer with a flag.
  - Payment: require chosen method; once initiated, require `paymentConfirmed`.
- Expand `VALIDATION_RULES` in `frontend/constants/motorInsuranceConfig.js` for category‑specific requirements.

10. Context/state small gaps

- Ensure context stores:
  - `documents` as id/url pairs from backend (not only local URIs).
  - `payment` object: `{ method, reference, status, amount }` and `paymentConfirmed` boolean.
  - `selectedUnderwriter` with normalized pricing used later.

## Minimal code pointers to implement

- MotorInsuranceScreen.js

  - On DocumentsUpload `onDocumentsChange`, call `djangoAPI.uploadDocument` per doc and replace local entry with `{ id/url }` returned.
  - On Payment Next, initiate payment and start polling before allowing Submission step.
  - On Submission Next, call `actions.submitQuotation()` and then `djangoAPI.issuePolicy()` if paid.

- MotorInsuranceContext.js

  - Add `payment` and `paymentConfirmed` to state; add actions to set them.
  - In `submitQuotation`, enrich payload with selected underwriter, documents (IDs), addons totals, and payment details.

- DjangoAPIService.js
  - If backend expects multipart for document upload, add a `uploadDocumentFile(formData)` variant using `fetch` with `Content-Type: multipart/form-data` (don’t set boundary manually; let RN set it).
  - Consider small helper `pollPayment(reference, { intervalMs, timeoutMs })` that uses `getPaymentStatus`.

## Backend acceptance examples

- compare_motor_pricing response (simplified):

```json
{
  "comparisons": [
    {
      "result": {
        "underwriter_id": "...",
        "underwriter_code": "BRITAM",
        "underwriter_name": "Britam",
        "category": "PRIVATE",
        "cover_type": "COMPREHENSIVE",
        "base_premium": 24500,
        "training_levy": 61,
        "pcf_levy": 61,
        "stamp_duty": 40,
        "total_premium": 24662,
        "features": {
          "pricing": { "PRIVATE_COMPREHENSIVE": { "base_premium": 24500 } }
        }
      }
    }
  ]
}
```

- calculate_motor_premium response (simplified and preferred):

```json
{
  "base_premium": 24500,
  "training_levy": 61,
  "pcf_levy": 61,
  "stamp_duty": 40,
  "total_premium": 24662
}
```

## Done vs To‑do

Already implemented (client):

- Categories fetch and render
- Cover types fetch and curated display
- Dynamic vehicle form with early underwriter comparison
- Underwriter comparison UI with normalization and minimum premium logic
- Premium calculation step and UI
- Add‑ons calculation engine and UI
- Client details form

To finalize:

- Wire document upload API and store returned IDs
- Implement payment initiation + status polling; gate step progression
- Build and send final submission payload; optionally issue policy
- Strengthen validation and gating across steps
- Ensure backend endpoints exist and return expected shapes

Once the above are implemented, the Motor 2 flow will complete a full quotation → payment → policy issuance cycle against the Django backend.
