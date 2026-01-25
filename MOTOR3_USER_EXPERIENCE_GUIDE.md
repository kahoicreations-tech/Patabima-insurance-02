# Motor3 User Experience - Error Scenarios

## Visual Guide to Error Handling

This document shows what users actually see in different scenarios.

---

## Scenario 1: Certificate Issued Successfully ✅

### What Happens:
- Payment succeeds
- Policy created
- DMVIC certificate issued immediately

### What User Sees:

```
┌─────────────────────────────────────┐
│                                     │
│           ✓                         │
│    ┌─────────────┐                  │
│    │             │                  │
│    └─────────────┘                  │
│                                     │
│  Policy Created Successfully!       │
│                                     │
│  ┌────────────────────────────────┐ │
│  │   Policy Number                │ │
│  │   POL-2026-737914              │ │
│  └────────────────────────────────┘ │
│                                     │
│  ┌────────────────────────────────┐ │
│  │  🏆 DMVIC Certificate          │ │
│  │                                │ │
│  │  Certificate No: 12345678      │ │
│  │  Type: Type A                  │ │
│  │  Status: ACTIVE                │ │
│  │                                │ │
│  │  [ 📥 Download Certificate ]   │ │
│  └────────────────────────────────┘ │
│                                     │
│  [ 📤 Share Policy ]                │
│  [ 📋 View All Policies ]           │
│                                     │
└─────────────────────────────────────┘
```

**User Actions:**
- Download certificate PDF
- Share policy details
- View all policies
- Create new quote

---

## Scenario 2: Certificate Pending (Token Expired) ⚠️

### What Happens:
- Payment succeeds
- Policy created
- DMVIC API token expired
- Backend returns warning

### What User Sees:

**Step 1: Success Screen Loads**

```
┌─────────────────────────────────────┐
│                                     │
│           ✓                         │
│                                     │
│  Policy Created Successfully!       │
│                                     │
│  ┌────────────────────────────────┐ │
│  │   Policy Number                │ │
│  │   POL-2026-737914              │ │
│  └────────────────────────────────┘ │
```

**Step 2: Warning Toast Appears (Auto)**

```
┌─────────────────────────────────────┐
│  ⚠️ Certificate Pending             │
│                                     │
│  Your payment was successful and    │
│  policy is active! However, we      │
│  couldn't fetch your certificate    │
│  from DMVIC at this time due to a   │
│  temporary system connection issue. │
│                                     │
│  What happens next:                 │
│  • Your policy is fully active      │
│  • Our team will issue your         │
│    certificate within 24 hours      │
│  • You'll receive an SMS when ready │
│  • You can retry anytime            │
│                                     │
│              [ OK ]                 │
└─────────────────────────────────────┘
```

**Step 3: Certificate Section Shows Pending**

```
│  ┌────────────────────────────────┐ │
│  │  ⏳ DMVIC Certificate          │ │
│  │                                │ │
│  │  DMVIC certificate issuance    │ │
│  │  is in progress.               │ │
│  │                                │ │
│  │  Your policy is active. The    │ │
│  │  certificate will be available │ │
│  │  shortly.                      │ │
│  │                                │ │
│  │  [ 🔄 Retry DMVIC Certificate ]│ │
│  └────────────────────────────────┘ │
```

**User Actions:**
- View policy (active)
- Retry certificate issuance
- Continue using app
- No blocking - policy is valid

---

## Scenario 3: Mock Certificate (UAT Environment) 🧪

### What Happens:
- Payment succeeds
- Policy created
- DMVIC UAT unavailable
- System generates mock certificate

### What User Sees:

```
┌─────────────────────────────────────┐
│                                     │
│           ✓                         │
│                                     │
│  Policy Created Successfully!       │
│                                     │
│  ┌────────────────────────────────┐ │
│  │   Policy Number                │ │
│  │   POL-2026-737914              │ │
│  └────────────────────────────────┘ │
│                                     │
│  ┌────────────────────────────────┐ │
│  │  🧪 Test Environment           │ │
│  │                                │ │
│  │  This is a test certificate    │ │
│  │  generated for UAT/development │ │
│  │  purposes. In production, you  │ │
│  │  will receive an official      │ │
│  │  DMVIC certificate issued      │ │
│  │  directly from the regulatory  │ │
│  │  authority.                    │ │
│  │                                │ │
│  │  📋 What this means:           │ │
│  │  • Your policy is valid        │ │
│  │  • This is for testing only    │ │
│  │  • Production gets real cert   │ │
│  │  • Cert # starts with "MOCK-"  │ │
│  └────────────────────────────────┘ │
│                                     │
│  ┌────────────────────────────────┐ │
│  │  🏆 DMVIC Certificate          │ │
│  │                                │ │
│  │  Certificate No: MOCK-737914   │ │
│  │  Type: Type A                  │ │
│  │  Status: ISSUED                │ │
│  │                                │ │
│  │  [ 📥 Download Certificate ]   │ │
│  └────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

**Key Differences:**
- Orange warning box at top
- "🧪 Test Environment" header
- Clear explanation this is for testing
- Mock certificate still downloadable
- Certificate number shows "MOCK-" prefix

---

## Scenario 4: Double Insurance Detected ❌

### What Happens:
- User enters vehicle registration
- DMVIC check finds active coverage
- Submission BLOCKED by regulations

### What User Sees:

**During Submission (Progress Screen)**

```
┌─────────────────────────────────────┐
│                                     │
│         Creating Policy...          │
│                                     │
│  [████████░░░░░░░░░░░░░░░░] 40%    │
│                                     │
│  Checking for existing coverage...  │
│                                     │
└─────────────────────────────────────┘
```

**DMVIC Check Detects Active Coverage**

```
┌─────────────────────────────────────┐
│  ⚠️ DMVIC Insurance Active          │
│                                     │
│  CANNOT CREATE NEW POLICY           │
│                                     │
│  DMVIC database confirms this       │
│  vehicle has active insurance:      │
│                                     │
│  Policy: ICA/2026/12345             │
│  Underwriter: Jubilee Insurance     │
│  Cover Type: Comprehensive          │
│  Expiry: 2026-12-31                 │
│                                     │
│  Kenyan law prohibits duplicate     │
│  motor insurance. The existing      │
│  policy must expire or be           │
│  cancelled before a new one can     │
│  be issued.                         │
│                                     │
│  [ Contact Support ] [ Go Back ]    │
└─────────────────────────────────────┘
```

**If User Selects "Contact Support":**

```
┌─────────────────────────────────────┐
│  Support Contact                    │
│                                     │
│  For policy cancellation or         │
│  transfer:                          │
│                                     │
│  Phone: 0700 123 456                │
│  Email: support@patabima.com        │
│                                     │
│              [ OK ]                 │
└─────────────────────────────────────┘
```

**User Actions:**
- Cannot proceed (regulatory requirement)
- Contact support to cancel existing policy
- Go back and try different vehicle
- No workaround available (DMVIC authority)

---

## Scenario 5: No DMVIC Inventory 📦

### What Happens:
- Payment succeeds
- Policy created
- DMVIC has no sticker inventory
- Preview certificate generated

### What User Sees:

```
┌─────────────────────────────────────┐
│                                     │
│           ✓                         │
│                                     │
│  Policy Created Successfully!       │
│                                     │
│  ┌────────────────────────────────┐ │
│  │   Policy Number                │ │
│  │   POL-2026-737914              │ │
│  └────────────────────────────────┘ │
│                                     │
│  ┌────────────────────────────────┐ │
│  │  📦 DMVIC Certificate          │ │
│  │                                │ │
│  │  🏆 DMVIC Inventory Pending    │ │
│  │                                │ │
│  │  Your policy is active, but    │ │
│  │  DMVIC certificate issuance    │ │
│  │  requires sticker inventory    │ │
│  │  allocation.                   │ │
│  │                                │ │
│  │  📋 What this means:           │ │
│  │  • Your policy is valid        │ │
│  │  • Certificate preview below   │ │
│  │  • Final cert pending DMVIC    │ │
│  │  • No action required          │ │
│  │                                │ │
│  │  [ 🔍 View Certificate Preview]│ │
│  └────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

**User Actions:**
- View preview certificate
- Use preview for verification
- Wait for DMVIC inventory allocation
- Policy is fully active

---

## Scenario 6: UAT Environment Error ⚠️

### What Happens:
- Payment succeeds
- Policy created
- DMVIC UAT server down
- Expected in test environment

### What User Sees:

```
┌─────────────────────────────────────┐
│                                     │
│           ✓                         │
│                                     │
│  Policy Created Successfully!       │
│                                     │
│  ┌────────────────────────────────┐ │
│  │  ⏳ DMVIC Certificate          │ │
│  │                                │ │
│  │  🔴 DMVIC UAT Environment      │ │
│  │     Issue                      │ │
│  │                                │ │
│  │  The DMVIC UAT testing         │ │
│  │  environment is currently      │ │
│  │  unavailable. This is expected │ │
│  │  in test mode.                 │ │
│  │                                │ │
│  │  📋 What this means:           │ │
│  │  • Your policy is valid        │ │
│  │  • Certificate will issue in   │ │
│  │    production                  │ │
│  │  • Only affects test/UAT env   │ │
│  │  • No action required          │ │
│  │                                │ │
│  │  [ 🔄 Retry DMVIC Certificate ]│ │
│  └────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

**User Actions:**
- Understand this is test environment issue
- Retry if desired
- Policy is active
- Production unaffected

---

## Summary of User Experience

| Scenario | User Can Proceed? | Message Type | Action Required |
|----------|------------------|--------------|-----------------|
| **Certificate Issued** | ✅ Yes | Success | Download cert |
| **Certificate Pending** | ✅ Yes | Warning Toast | Wait/Retry |
| **Mock Certificate** | ✅ Yes | Info Warning | Understand test mode |
| **Double Insurance** | ❌ No | Blocking Alert | Contact support |
| **No Inventory** | ✅ Yes | Info | View preview |
| **UAT Error** | ✅ Yes | Info | No action needed |

---

## Key Principles

### 1. Success First
- Policy creation success is always shown prominently
- Certificate issues are secondary concerns
- User is never blocked by certificate failures

### 2. Clear Communication
- No technical jargon
- Simple language
- Actionable next steps
- Realistic timeframes

### 3. Visual Hierarchy
- ✅ Green = Success, proceed
- ⚠️ Orange = Warning, informational
- ❌ Red = Error, blocked
- 🧪 Orange = Test/Mock, understand context

### 4. User Empowerment
- Always show what user CAN do
- Provide retry options
- Offer support contact
- Explain wait times

### 5. Regulatory Compliance
- Double insurance is BLOCKED (non-negotiable)
- Clear explanation of legal requirements
- No workarounds offered
- Support contact for legitimate cases

---

## Testing Checklist

When testing Motor3 flow, verify:

- [ ] Success toast appears for all policy creations
- [ ] Warning toast appears when certificate pending
- [ ] Mock certificate warning shows in UAT
- [ ] Double insurance alert blocks submission
- [ ] Preview button works when available
- [ ] Download button works for issued certificates
- [ ] Retry button available for pending certificates
- [ ] Support contact info accessible
- [ ] Policy number always visible
- [ ] User can navigate away from success screen

---

**Document Status:** Complete
**Last Updated:** January 2026
**Related Docs:** MOTOR3_ERROR_HANDLING_COMPLETE.md
