# Motor3 DMVIC Drawer Flow + Troubleshooting (Source of Truth)

This guide exists so you can debug “drawer not showing / wrong gating / date keeps shifting” in minutes.

## Scope

Applies to **Motor3 → Third Party flow** on the **Vehicle step** (the step where registration + cover start date are entered).

Key files:

- `frontend/screens/quotations/Motor3/third-party/steps/Step2_VehicleDetails.js`
- `frontend/screens/quotations/Motor3/third-party/components/VehicleVerificationDrawer.js`

Backend endpoint used:

- `POST /api/insurance/dmvic/search-vehicle/`

---

## What “Correct” Looks Like (Expected UX)

### When user taps **Next** on Vehicle step

1. App validates required inputs exist:

   - `registrationNumber`
   - `identificationType === 'Vehicle Registration'` (only this triggers DMVIC)
   - `cover_start_date`
   - `financialInterest`

2. App calls DMVIC endpoint:

   - Sends `registration_number` (uppercase) and `proposed_cover_start_date`.

3. If DMVIC returns vehicle data, app locks DMVIC fields (where available):

   - make/model/year/color/chassis/engine/logbook

4. Drawer behavior:

   - If DMVIC response indicates **any cover context**, the drawer opens and user must acknowledge.
   - “Cover context” means ANY of:
     - active cover flags (any casing)
     - an expiry date present
     - policy history present

5. Collision gating (strict):
   - If there is an expiry date and selected start date is **before** expiry + 1 day, this is a collision.
   - User cannot proceed until they pick a compliant date.

### Inside the drawer

- If **collision**:

  - Show the conflict message + the earliest allowed start date.
  - Actions:
    - **Go Back & Adjust** → closes drawer so user edits date.
    - **Set to [min date]** → sets the date AND auto-continues.

- If **no collision** (date already valid):
  - Show “valid date” state.
  - **Continue with Current Date** → continues to next step.

---

## Date Rules (No Off-by-One)

### Source of the expiry date

Expiry is resolved from multiple possible fields because DMVIC responses vary by environment:

- `vehicle.current_policy.cover_end_date`
- `vehicle.current_policy.expiry_date`
- `vehicle.current_policy.CoverEndDate`
- `resp.existing_cover_expiry`
- `resp.existingCoverExpiry`

### Compliance rule

Let:

- `expiry = cover_end_date`
- `minStart = expiry + 1 day`

Then selected start date is compliant if:

`selectedStart >= minStart`

### Parsing rule

- `YYYY-MM-DD` must be treated as a **local date** (not UTC) to avoid timezone shifting.
- Never rely on `toISOString()` for comparisons.

---

## Failure Modes + Fast Diagnosis

### 1) Drawer never appears

Most common causes:

- DMVIC endpoint not reachable
- DMVIC response shape changed (flags/expiry/history in different fields)
- `identificationType` not “Vehicle Registration” so DMVIC never runs

Fast checks:

- Backend reachable from dev machine:
  - PowerShell: `Test-NetConnection 127.0.0.1 -Port 8000`
- Backend reachable from emulator:
  - Ensure frontend uses `EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000`

What to log:

- In Metro logs you should see:
  - `[Step2_VehicleDetails] DMVIC Response: ...`

If that log never prints:

- The DMVIC call is not happening (validation blocking or wrong identification type).

If it prints but drawer doesn’t open:

- The response likely contains cover context in a field the detector isn’t checking.
  - Fix: expand detection in `Step2_VehicleDetails.js`.

### 2) Drawer shows, but still proceeds with a bad date

Cause:

- Collision check is not executed or uses mismatched date parsing.

Fix pattern:

- Derive `minStart` from expiry and compare against **parsed local** dates.

### 3) Drawer is “jumpy” / closes unexpectedly

Cause:

- Auto-close effects that close the modal when the date becomes compliant.

Fix pattern:

- Do NOT auto-close on state change. Let user explicitly tap Continue, OR auto-continue only for “Set to min date”.

### 4) Set-to-min-date doesn’t continue

Cause:

- Drawer only updated the date but did not trigger the Continue action.

Fix pattern:

- In `VehicleVerificationDrawer`, after `onSetCoverStartDate(minISO)`, call `onContinue(minISO)`.

---

## Recommended Quick Repro (Debug Vehicle)

Use a known registration that returns cover data, then try two dates:

- A conflicting date (before expiry+1) → drawer should show conflict and force change.
- The min allowed date → drawer should allow Continue (or auto-continue when you tap Set).

---

## Code-Level Contracts (Do Not Break)

### Contract A — Drawer open conditions

`Step2_VehicleDetails.handleNext()` MUST:

- save DMVIC result into Motor3Context via `setDMVICSearchResult`
- open the drawer when there is any cover context AND not acknowledged

### Contract B — Collision gating

If collision is detected:

- MUST NOT call `onNext()`
- MUST show the drawer

### Contract C — “Set to min date”

- MUST set `cover_start_date` to computed min date
- MUST auto-continue when the date is now compliant

---

## Where to Change Things Safely

- Drawer UI text/buttons: `VehicleVerificationDrawer.js`
- DMVIC response parsing + gating: `Step2_VehicleDetails.js`
- Persisted DMVIC state: `Motor3Context.js`

---

## Minimal Checklist Before Shipping

- Conflicting start date always blocks progression.
- Valid start date still shows DMVIC drawer once (acknowledgement), then proceeds.
- “Set to [min date]” auto-continues.
- No off-by-one day drift when using ISO date strings.
