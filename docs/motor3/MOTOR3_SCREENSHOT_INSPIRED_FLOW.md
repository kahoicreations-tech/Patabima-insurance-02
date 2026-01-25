# Motor Flow (Screenshot-Inspired)

This document is derived **strictly from the provided screenshots** (Quotations list/details, Quote Generated success, PDF quote view, Upcoming Renewals/Extensions, Extend Policy stepper, Payment methods, Notifications “Certificate Received”).

## 1) High-Level ASCII Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ HOME                                                     │
│  - Has an "Upcoming" quick section with tabs:            │
│    Renewals (n) | Extensions (n)                          │
│  - Shows at least one item card with:                    │
│    Reg, Client name, Type, Premium (gross), Days badge   │
│  - "View All" navigates to the full Upcoming screen      │
└───────────────┬─────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────┐
│ QUOTATIONS (LIST)                                         │
│  Tabs: All | Applied | Unapplied                          │
│  Search bar                                                │
│  Each quote row shows:                                    │
│   - Vehicle Reg (e.g., KDM387S)                            │
│   - Policy Type (e.g., PsvUC)                              │
│   - Amount (e.g., Ksh. 37,207 (gross))                     │
│   - Status chip: Applied / Unapplied                       │
│   - Expand/collapse chevron                                │
└───────────────┬─────────────────────────────────────────┘
                │ expand a quote
                ▼
┌─────────────────────────────────────────────────────────┐
│ QUOTATIONS (DETAIL IN LIST / EXPANDED CARD)               │
│  Shows fields:                                            │
│   - Insurance Provider: (e.g., Trident)                    │
│   - Total Premium: Ksh. 37,207 (gross)                     │
│   - Vehicle Registration: KDM387S                          │
│   - Date Created: (e.g., 25/10/2025 or 28/11/2025)         │
│  Actions depend on status:                                │
│   - Always: View Quotation                                 │
│   - If Unapplied: Apply Policy                             │
└───────────────┬─────────────────────────────────────────┘
                │ View Quotation
                ▼
┌─────────────────────────────────────────────────────────┐
│ QUOTE DOCUMENT (PDF/VIEW)                                 │
│  Title: "Quote for Reg No: <REG>"                          │
│  Heading: "Insurance Quotation for <Provider>"             │
│  Sections visible:                                        │
│   - Basic Information (registration, provider, policy...)  │
│   - Estimated Amount (premium breakdown)                   │
│   - Options (items like excess / loss of use etc.)         │
│   - Payment Details                                        │
│  There is a final "Payable" amount (gross).                │
└───────────────┬─────────────────────────────────────────┘
                │ Generate / proceed / success
                ▼
┌─────────────────────────────────────────────────────────┐
│ QUOTE GENERATED SUCCESSFULLY                               │
│  Message: "Quote Generated Successfully!" + timestamp      │
│  Actions:                                                  │
│   - Download Quote                                         │
│   - View Quote                                             │
│   - Share Quote                                            │
│  Navigation:                                               │
│   - Go back to Quotations                                  │
│   - Exit                                                   │
│  Variant screenshot also shows: "Apply Now" (CTA)          │
└───────────────┬─────────────────────────────────────────┘
                │ Apply Now / Apply Policy
                ▼
┌─────────────────────────────────────────────────────────┐
│ UPCOMING (FULL SCREEN)                                    │
│  Search, "Clear search for: <REG>"                         │
│  Tabs with counts: Renewals (n) | Extensions (n)            │
│  Each tab groups items:                                   │
│   - Overdue (n)                                             │
│   - Upcoming (n)                                            │
│  Cards display details + a single primary CTA               │
└───────────────┬─────────────────────────────────────────┘
                │ Extensions tab: Extend Policy
                ▼
┌─────────────────────────────────────────────────────────┐
│ EXTEND POLICY (STEPPER)                                   │
│  Header: "Extend Policy - <REG>"                           │
│  Steps shown: 1) Policy Holder  →  2) Payment              │
│                                                         │
│  Step 1: Policy Holder                                    │
│   - Financial Interest: Yes/No (radio)                     │
│   - Cover Start Date: (e.g., December 29, 2025)            │
│   - Duration: dropdown (e.g., 1 Month)                     │
│   - Next button                                            │
│                                                         │
│  Step 2: Payment                                           │
│   - Shows product name + cover type (example visible):     │
│       "PSV Uber Comprehensive"                             │
│   - Shows provider (example visible): Trident              │
│   - Shows amount due now (example visible): KES 9,266      │
│   - Shows totals line (example visible):                   │
│       "KES 37,207 | Paid KES 9,150"                        │
│   - Payment methods:                                      │
│       * Mpesa STK Push (initiate STK push to customer)     │
│       * Mpesa Paybill (Paybill Number: 4114079;            │
│           Account Number: Vehicle Registration)            │
│       * Manual Payment Verification (submit for manual)    │
│   - Confirm Payment button                                 │
└───────────────┬─────────────────────────────────────────┘
                │ Confirm Payment
                ▼
┌─────────────────────────────────────────────────────────┐
│ NOTIFICATIONS                                              │
│  Event: "Certificate Received"                             │
│  Message: "Policy Certificate for vehicle <REG> has been    │
│           issued. Kindly check your email."                │
│  Attachment: <REG>.pdf                                     │
└─────────────────────────────────────────────────────────┘
```

## 2) Business Logic From the Screens

### A) Quotations = “Draft commercial offer” state

From the Quotations list + expanded detail:

- A quotation is identified/displayed primarily by **Vehicle Registration** (e.g., KDM387S), **Policy Type** (e.g., PsvUC), and **Premium** (gross).
- A quotation has a clear lifecycle status:
  - **Unapplied**: The quote exists, but has not been “converted/applied” into a live policy action.
  - **Applied**: The quote has been applied/converted (or at least actioned) such that it’s no longer pending.
- The list supports:
  - Search
  - Filtering by status (All / Applied / Unapplied)
  - Expand/collapse to see more details and action buttons.

**Expanded card fields imply the minimum data model the UI expects:**

- Insurance Provider
- Total Premium (gross)
- Vehicle Registration
- Date Created

**Action rules from UI:**

- “View Quotation” exists for both Applied and Unapplied.
- “Apply Policy” exists only when the quote is Unapplied.

### B) Quote Document = formal quote artifact

From the PDF-like view:

- The quote document is branded/formatted and titled: **“Quote for Reg No: <REG>”**.
- It shows: **“Insurance Quotation for <Provider>”**.
- It includes sections:
  - Basic Information
  - Estimated Amount (premium breakdown)
  - Options (add-ons/extras like excess, loss of use, etc. are visible as headings/items)
  - Payment Details

**Business logic implied:**

- The quote is meant to be shared/downloaded and is part of the agent’s sales cycle.
- The quote includes a breakdown (not just a final number), supporting transparency.

### C) “Quote Generated Successfully” = terminal state for quote creation

From the success screens:

- After quote generation, the agent can:
  - Download Quote
  - View Quote
  - Share Quote
- There’s always a safe way out:
  - Go back to Quotations
  - Exit
- A variant also shows a strong CTA: **“Apply Now”**.

**Business logic implied:**

- Quote generation is distinct from applying/activating; user is explicitly invited to apply.
- “Apply Now” is a shortcut into “Apply Policy” flow.

### D) Upcoming screen = operational follow-up workspace

From the Upcoming screens:

- Upcoming is split into two top-level tabs:
  - **Renewals**
  - **Extensions**
- Both tabs support:
  - Search by vehicle reg
  - Clearing search ("Clear search for: <REG>")
- Each tab groups items by urgency:
  - **Overdue (n)**
  - **Upcoming (n)**

#### Renewals card behavior (from screenshot)

- Example shows:
  - Vehicle reg KBG987E
  - Policy Type TORP
  - Insurance Provider Definite
  - Total Premium Ksh. 550 (net)
  - Expiry Date 05/12/2025
  - CTA: **Renew Policy**

**Business logic implied:**

- Renewal is driven by **policy expiry**; card shows “Days” badge (e.g., “6 Days”).
- Renewal has one primary action: Renew Policy.

#### Extensions card behavior (from screenshots)

Extensions cards show (examples with KDM387S):

- Status badge variants:
  - “29 Days” (green-ish)
  - “Expired” (red) in Overdue
- Fields displayed on the card:
  - Insurance Provider (e.g., Trident)
  - Total Premium (gross)
  - Certificates Issued (a count)
  - Premium Balance
  - Total Paid
  - Expiry Date
- CTA changes based on state:
  - **Extend Policy** (normal)
  - **Pending Valuation** (blocked/gated state)

**Business logic implied:**

- “Extensions” is not just “policy expiry extension” — it tracks an **outstanding balance** structure:
  - Total Premium
  - Total Paid
  - Premium Balance
    This strongly implies the extension action is about settling/continuing coverage via staged payments.
- There is a gating step called **Valuation**:
  - When valuation is required/not completed, the CTA becomes “Pending Valuation” instead of “Extend Policy”.

### E) Extend Policy = 2-step wizard

From the Extend Policy stepper:

#### Step 1: Policy Holder

Fields:

- Financial Interest: Yes/No
- Cover Start Date: shown as a date (example: December 29, 2025)
- Duration: dropdown (example: 1 Month)
- Next button

**Business logic implied:**

- Extension needs a confirmation of whether there is financial interest.
- Extension starts on a specific “Cover Start Date” and lasts for the chosen duration.

> Important note from screenshots: Comprehensive appears in extension context.
>
> The Payment step example shows: “PSV Uber Comprehensive”.
> That means **Comprehensive** products can participate in this “extend-like” flow (same structure: duration → payment).

#### Step 2: Payment

The payment screen shows:

- Product label + cover type (example: PSV Uber Comprehensive)
- Provider (Trident)
- Amount due now (example: KES 9,266)
- A totals line that reads like:
  - Total premium amount | Paid amount

Payment methods offered:

- Mpesa STK Push (initiate STK push to customer)
- Mpesa Paybill
  - Paybill Number: 4114079
  - Account Number: Vehicle Registration
- Manual Payment Verification

Confirm Payment CTA.

**Business logic implied:**

- Payment is the commitment step for extension.
- There are three payment paths:
  1. Real-time STK push
  2. Paybill (offline payment) with reconciliation via vehicle reg as account number
  3. Manual payment verification

### F) Certificate received notification = post-payment fulfillment

From Notifications screen:

- Notification title: “Certificate Received”
- Body: “Policy Certificate for vehicle <REG> has been issued. Kindly check your email.”
- Attachment: <REG>.pdf

**Business logic implied:**

- After successful apply/extend/payment, a **policy certificate PDF** is generated and delivered.
- The app provides an in-app notification + email instruction.

## 3) “Valuation” (as shown)

A screenshot shows an Extensions card in Overdue with CTA: **Pending Valuation**.

**What this implies in flow terms:**

- There exists a valuation-dependent rule gate. Until valuation completes, extension cannot proceed to Step 1/Step 2.

**Minimal flow gate (strictly from screenshots):**

```
If valuation_required AND not_valued_yet:
  Extensions card CTA = "Pending Valuation" (blocked)
Else:
  Extensions card CTA = "Extend Policy" (allowed)
```

## 4) Minimal State Machine (derived from screenshots)

### Quote lifecycle

```
Unapplied Quote  --(Apply Policy / Apply Now)-->  Applied
      |
      +--(View Quotation)--> Quote Document (PDF)

Quote Generated Successfully = confirmation state after quote creation
  with actions: Download/View/Share + Back/Exit (+ sometimes Apply Now)
```

### Upcoming items lifecycle

Renewals:

```
Upcoming renewal item  --(Renew Policy)--> renewal process (not shown)
```

Extensions:

```
Extension item
  ├─ if Pending Valuation: CTA = "Pending Valuation" (blocked)
  └─ else CTA = "Extend Policy" → Step 1 (Policy Holder) → Step 2 (Payment) → Confirm Payment
       → Certificate Received notification with PDF attachment
```

## 5) UI/Copy elements that are “source of truth” from screenshots

- Tabs:
  - Quotations: All / Applied / Unapplied
  - Upcoming: Renewals (n) / Extensions (n)
- Group headings:
  - Overdue (n)
  - Upcoming (n)
- Buttons:
  - View Quotation
  - Apply Policy
  - Apply Now
  - Extend Policy
  - Pending Valuation
  - Renew Policy
  - Confirm Payment
- Payment methods:
  - Mpesa STK Push
  - Mpesa Paybill (Paybill: 4114079; Account: Vehicle Registration)
  - Manual Payment Verification
- Notification message:
  - “Certificate Received” + “Kindly check your email.” + PDF attachment

---

If you upload the remaining step-by-step images (step 1–step 5 / validate / getpdf), I can extend this document to include _those exact screens_ too (field-by-field) without adding any assumptions.
