# Medical Insurance Admin Pricing Workflow

## Overview

When a user submits a medical insurance quote, it creates a `ManualQuote` record with status `PENDING_ADMIN_REVIEW`. The admin then needs to calculate the pricing and send it back to the agent/user. Here's the recommended workflow:

---

## Current System Architecture

### Database Model: `ManualQuote`

```python
class ManualQuote(models.Model):
    reference = "MNL-MEDICAL-ABC12345"  # Unique reference
    line_key = "MEDICAL"                 # Insurance type
    agent = ForeignKey(User)             # Agent who submitted
    payload = JSONField()                # Complete form data
    preferred_underwriters = JSONField() # List of underwriter IDs

    # Admin fills these fields:
    status = "PENDING_ADMIN_REVIEW"      # Workflow status
    computed_premium = Decimal           # Final total amount
    levies_breakdown = JSONField         # Detailed pricing breakdown
    admin_notes = TextField              # Internal notes
```

### Status Workflow

```
PENDING_ADMIN_REVIEW  →  IN_PROGRESS  →  COMPLETED
                                      ↓
                                  REJECTED
```

---

## Recommended Admin Workflow

### Option 1: Django Admin Panel (Current - Best for MVP)

This is the **recommended approach** for your current setup.

#### Step 1: Admin Receives Notification

- Agent submits medical quote through the app
- Quote appears in Django Admin under **"Manual Quote"** section
- Filter by `line_key=MEDICAL` to see only medical quotes
- Filter by `status=PENDING_ADMIN_REVIEW` to see pending quotes

#### Step 2: Admin Reviews Quote Details

Navigate to: **Django Admin → Manual Quote → [Select Quote]**

You'll see:

- **Reference**: e.g., `MNL-MEDICAL-ABC12345`
- **Agent**: Who submitted the quote
- **Payload**: Full form data with client details
  ```json
  {
    "inpatientLimit": "1m",
    "outpatientCover": true,
    "maternityCover": false,
    "age": "35",
    "spouseAge": "32",
    "numberOfChildren": "2",
    "fullName": "John Doe",
    "idNumber": "12345678",
    "phoneNumber": "0712345678",
    "emailAddress": "john@example.com",
    "preferredUnderwriters": ["JUBILEE", "AAR", "BRITAM"]
  }
  ```

#### Step 3: Calculate Pricing

The admin manually calculates the premium based on:

- Inpatient limit (e.g., KES 1,000,000)
- Additional benefits (outpatient, maternity)
- Number of covered persons (principal + spouse + children)
- Age factors
- Selected underwriters

**Example Calculation:**

```
Base Premium (1M cover, age 35): KES 45,000
Spouse Premium (age 32):         KES 38,000
Children (2 @ KES 15,000 each):  KES 30,000
Outpatient benefit:              KES 12,000
----------------------------------------------
Subtotal:                        KES 125,000

Levies & Charges:
- Training Levy (0.25%):         KES 312.50
- PCF Levy (0.25%):              KES 312.50
- Stamp Duty:                    KES 40.00
----------------------------------------------
TOTAL PREMIUM:                   KES 125,665.00
```

#### Step 4: Fill in Admin Fields in Django Admin

**Computed Premium:**

```
125665.00
```

**Levies Breakdown** (JSON):

```json
{
  "base_premium": 125000.0,
  "principal_premium": 45000.0,
  "spouse_premium": 38000.0,
  "children_premium": 30000.0,
  "outpatient_benefit": 12000.0,
  "training_levy": 312.5,
  "pcf_levy": 312.5,
  "stamp_duty": 40.0,
  "total_premium": 125665.0,
  "underwriter_quotes": {
    "JUBILEE": 125665.0,
    "AAR": 132500.0,
    "BRITAM": 128000.0
  },
  "selected_underwriter": "JUBILEE",
  "currency": "KES"
}
```

**Status:**

```
COMPLETED
```

**Admin Notes** (Optional):

```
Quoted for Jubilee (best rate).
Valid for 30 days.
Waiting period: 90 days for pre-existing conditions.
```

#### Step 5: Save & Notify Agent

Once you click **Save**, the quote is updated with:

- ✅ Status: `COMPLETED`
- ✅ Computed Premium: `125665.00`
- ✅ Levies Breakdown: Full JSON with details

**The agent can now see:**

1. The quote in their Quotations screen
2. Status badge showing "Completed" or "Ready for Payment"
3. The total premium amount
4. Option to proceed to payment

---

### Option 2: Custom Admin API (Future Enhancement)

For better UX, you could build a custom admin interface:

#### Backend Endpoint

Already exists: `PATCH /api/v1/public_app/admin/manual_quotes/{reference}`

```python
# Admin can call this endpoint to update pricing
PATCH /api/v1/public_app/admin/manual_quotes/MNL-MEDICAL-ABC12345

Headers:
  Authorization: Bearer {admin_jwt_token}

Body:
{
  "status": "COMPLETED",
  "computed_premium": "125665.00",
  "levies_breakdown": {
    "base_premium": 125000.00,
    "training_levy": 312.50,
    "pcf_levy": 312.50,
    "stamp_duty": 40.00,
    "total_premium": 125665.00
  },
  "admin_notes": "Quoted for Jubilee (best rate)"
}
```

#### Frontend Admin Portal (To Be Built)

Create a dedicated admin screen: `AdminManualQuotesPricingScreen.js`

Features:

- List of pending manual quotes
- Quick view of client details
- Built-in premium calculator
- One-click pricing approval
- Email notification to agent

**Benefits:**

- Faster workflow
- Built-in validation
- Automatic calculations
- Better audit trail

---

## Agent/User Notification Methods

### Method 1: In-App Notification (Current)

The agent checks their **Quotations** screen and sees:

- Status updated to "Completed" with green badge
- Total premium amount displayed
- "Proceed to Payment" button enabled

### Method 2: Push Notification (Recommended Enhancement)

When admin completes pricing:

```javascript
// Backend sends push notification
{
  title: "Medical Quote Ready",
  body: "Your medical quote MNL-MEDICAL-ABC12345 is ready. Total: KES 125,665",
  data: {
    type: "manual_quote_completed",
    reference: "MNL-MEDICAL-ABC12345",
    amount: 125665.00
  }
}
```

### Method 3: SMS Notification (Future)

```
PataBima: Your medical insurance quote is ready.
Total: KES 125,665.
Login to proceed with payment.
```

### Method 4: Email Notification (Future)

Send detailed email with:

- Quote reference
- Coverage summary
- Premium breakdown
- Payment instructions
- Link to app

---

## Recommended Pricing Calculation Tools

### Manual Calculation (Current)

Use Excel/Google Sheets with formulas:

```excel
| Item                  | Amount      |
|-----------------------|-------------|
| Base Premium          | =VLOOKUP()  |
| Spouse Premium        | =VLOOKUP()  |
| Children Premium      | =COUNT*RATE |
| Benefits Premium      | =SUM()      |
| Subtotal              | =SUM(above) |
| Training Levy (0.25%) | =Subtotal*0.0025 |
| PCF Levy (0.25%)      | =Subtotal*0.0025 |
| Stamp Duty            | 40          |
| **TOTAL PREMIUM**     | =SUM(all)   |
```

### Automated Calculator (Future Enhancement)

Build a Django management command or admin action:

```python
# insurance-app/app/management/commands/calculate_medical_premium.py

from decimal import Decimal
from app.models import ManualQuote

def calculate_medical_premium(quote_reference):
    quote = ManualQuote.objects.get(reference=quote_reference)
    payload = quote.payload

    # Extract details
    inpatient = payload.get('inpatientLimit')
    age = int(payload.get('age', 0))
    spouse_age = int(payload.get('spouseAge', 0)) if payload.get('spouseAge') else 0
    num_children = int(payload.get('numberOfChildren', 0))
    outpatient = payload.get('outpatientCover', False)
    maternity = payload.get('maternityCover', False)

    # Get base rates from pricing table
    base_premium = get_medical_base_rate(inpatient, age)
    spouse_premium = get_medical_base_rate(inpatient, spouse_age) if spouse_age else 0
    children_premium = num_children * get_child_rate(inpatient)

    # Add benefits
    outpatient_premium = 12000 if outpatient else 0
    maternity_premium = 25000 if maternity else 0

    # Calculate subtotal
    subtotal = base_premium + spouse_premium + children_premium + outpatient_premium + maternity_premium

    # Calculate levies (mandatory for all insurance in Kenya)
    training_levy = subtotal * Decimal('0.0025')  # 0.25%
    pcf_levy = subtotal * Decimal('0.0025')       # 0.25%
    stamp_duty = Decimal('40.00')                 # Fixed KES 40

    # Total
    total = subtotal + training_levy + pcf_levy + stamp_duty

    # Update quote
    quote.computed_premium = total
    quote.levies_breakdown = {
        "base_premium": float(base_premium),
        "spouse_premium": float(spouse_premium),
        "children_premium": float(children_premium),
        "outpatient_benefit": float(outpatient_premium),
        "maternity_benefit": float(maternity_premium),
        "training_levy": float(training_levy),
        "pcf_levy": float(pcf_levy),
        "stamp_duty": float(stamp_duty),
        "total_premium": float(total),
        "currency": "KES"
    }
    quote.status = 'COMPLETED'
    quote.save()

    return quote
```

Usage:

```bash
python manage.py shell
>>> from app.services import calculate_medical_premium
>>> calculate_medical_premium('MNL-MEDICAL-ABC12345')
```

---

## Next Steps After Pricing

Once admin completes pricing:

### 1. Agent Reviews Quote

- Agent sees completed quote in app
- Reviews premium amount and breakdown
- Can view underwriter options if multiple quotes provided

### 2. Agent Shares with Client

- Agent shows quote to client (customer)
- Explains coverage and premium breakdown
- Client decides to proceed or request changes

### 3. Payment Processing

If client accepts:

- Agent selects payment method (M-PESA, Card, Bank Transfer)
- Client completes payment
- System generates policy document
- Policy is issued and activated

### 4. Policy Issuance

- Payment confirmed → Status changes to `PAID`
- Backend generates policy document (PDF)
- Policy number assigned
- Commission calculated for agent
- Policy delivered via email/SMS

---

## Summary: Recommended Immediate Steps

**For Current MVP (Use Django Admin):**

1. ✅ Admin logs into Django Admin Panel
2. ✅ Navigate to **Manual Quote** section
3. ✅ Filter by `line_key=MEDICAL` and `status=PENDING_ADMIN_REVIEW`
4. ✅ Click on quote to view details
5. ✅ Calculate premium manually (Excel or calculator)
6. ✅ Fill in:
   - `computed_premium`: Total amount
   - `levies_breakdown`: JSON with breakdown
   - `status`: Change to `COMPLETED`
   - `admin_notes`: Optional notes
7. ✅ Click **Save**
8. ✅ Agent sees updated quote in app immediately

**For Future Enhancement:**

- [ ] Build admin pricing calculator tool
- [ ] Add push notifications for quote status changes
- [ ] Create dedicated admin portal for quote management
- [ ] Implement SMS/Email notifications
- [ ] Add automated underwriter API integration
- [ ] Build comparison tool for multiple underwriter quotes

---

## Example Workflow (End-to-End)

### Day 1, 10:00 AM - Agent Submits Quote

```
Agent logs in → Medical Insurance → Fill form → Submit
✅ Quote MNL-MEDICAL-ABC12345 created
✅ Status: PENDING_ADMIN_REVIEW
✅ Shown success message: "Quote submitted for admin review"
```

### Day 1, 2:00 PM - Admin Processes Quote

```
Admin logs in → Django Admin → Manual Quote → Filter Medical + Pending
✅ Opens quote MNL-MEDICAL-ABC12345
✅ Reviews client details (age 35, spouse 32, 2 children, 1M cover)
✅ Calculates: KES 125,665
✅ Fills pricing fields + changes status to COMPLETED
✅ Saves quote
```

### Day 1, 2:01 PM - Agent Sees Update

```
Agent refreshes Quotations screen
✅ Quote MNL-MEDICAL-ABC12345 now shows "Completed"
✅ Amount: KES 125,665 displayed
✅ "Proceed to Payment" button active
```

### Day 1, 3:00 PM - Payment & Policy

```
Agent shows quote to client → Client accepts
Client pays via M-PESA → KES 125,665
✅ Payment confirmed
✅ Policy generated
✅ Commission calculated
✅ Agent receives notification
```

---

## Questions?

If you need help with:

- Setting up the premium calculation formula
- Building the admin pricing tool
- Implementing notifications
- Creating automated workflows

Let me know and I can provide the specific code implementation!
