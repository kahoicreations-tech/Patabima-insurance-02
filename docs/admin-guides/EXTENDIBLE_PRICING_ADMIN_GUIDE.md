# Extendible Pricing Configuration - Admin Panel Guide

**Date:** October 26, 2025  
**For:** PataBima Insurance Administrators  
**Purpose:** Configure payment plans for Third-Party Extendible products

---

## Quick Start

### Step 1: Access Admin Panel

1. Open browser: `http://localhost:8000/admin/`
2. Login with admin credentials
3. Navigate to: **APP** → **Extendible Pricing**
4. Click **"Add Extendible Pricing"** button

---

## Understanding Extendible Products

### What are Extendible Products?

Extendible products are **Third-Party insurance products** that allow clients to:

- Pay an **initial amount** (e.g., KSh 5,000) for short-term coverage (e.g., 30 days)
- Pay the **balance amount** (e.g., KSh 15,000) within a grace period (e.g., 90 days)
- Get **full annual coverage** (12 months) after balance payment

### The 11 Extendible Products in PataBima:

1. **Private Third-Party EXT** (`PRIVATE_THIRD_PARTY_EXT`)
2. **Commercial General Cartage TP EXT** (`COMMERCIAL_GENERAL_CARTAGE_TP_EXT`)
3. **Commercial General Cartage TP EXT (Prime Mover)** (`COMMERCIAL_GENERAL_CARTAGE_TP_EXT_PM`)
4. **Commercial Own Goods TP EXT** (`COMMERCIAL_OWN_GOODS_TP_EXT`)
5. **PSV Matatu 1 Week TP EXT** (`PSV_MATATU_1WK_TP_EXT`)
6. **PSV Tour Van TP EXT** (`PSV_TOUR_VAN_TP_EXT`)
7. **PSV Tuk-Tuk TP EXT** (`PSV_TUKTUK_TP_EXT`)
8. **PSV Uber TP EXT** (`PSV_UBER_TP_EXT`)
9. **TukTuk Commercial TP EXT** (`TUKTUK_COMMERCIAL_TP_EXT`)
10. **TukTuk PSV TP EXT** (`TUKTUK_PSV_TP_EXT`)
11. **Commercial Institutional TP EXT** (`SPECIAL_INSTITUTIONAL_TP_EXT`)

### The 8 Active Underwriters:

Check your admin panel for the current list of active insurance providers. Common ones include:

- CIC Insurance
- AAR Insurance
- APA Insurance
- Jubilee Insurance
- Madison Insurance
- etc.

---

## Admin Form Fields Explained

### 1. **Subcategory** (Required)

**Dropdown:** Select the extendible product

**Example:** "PRIVATE_THIRD_PARTY_EXT"

**What it means:** This is the insurance product you're configuring pricing for.

---

### 2. **Underwriter** (Required)

**Dropdown:** Select the insurance company

**Example:** "CIC Insurance"

**What it means:** Each underwriter can have different pricing for the same product.

---

### 3. **Initial Period Days** (Required, Default: 30)

**Input:** Number of days

**Recommended:** 30 days (1 month cover note)

**What it means:** How long the initial payment covers. Common values:

- 30 days = 1 month cover
- 7 days = 1 week cover (for PSV Matatu)
- 14 days = 2 weeks cover

**Example:** Client pays KSh 5,000 and gets 30 days of coverage.

---

### 4. **Initial Amount** (Required)

**Input:** Decimal (KSh)

**Recommended Range:**

- Private: KSh 3,000 - 7,000
- Commercial: KSh 5,000 - 10,000
- PSV: KSh 4,000 - 8,000
- TukTuk: KSh 3,000 - 6,000

**What it means:** The amount client pays upfront to get initial coverage.

**Example:** KSh 5,000.00

---

### 5. **Balance Amount** (Required)

**Input:** Decimal (KSh)

**Calculation:** `Total Annual Premium - Initial Amount`

**Example:**

- Total Annual: KSh 20,000
- Initial: KSh 5,000
- Balance: **KSh 15,000**

**What it means:** The remaining amount client must pay to extend to full year.

---

### 6. **Total Annual Premium** (Required)

**Input:** Decimal (KSh)

**Calculation:** `Initial Amount + Balance Amount`

**Recommended Range:**

- Private TP: KSh 15,000 - 25,000
- Commercial TP: KSh 25,000 - 40,000
- PSV TP: KSh 20,000 - 35,000
- TukTuk TP: KSh 12,000 - 20,000

**What it means:** The total cost for 12 months of coverage.

**Validation:** Must equal `initial_amount + balance_amount`

---

### 7. **Extension Deadline Days** (Required, Default: 30)

**Input:** Number of days

**Recommended:** 60-90 days

**What it means:** Client has this many days after initial expiry to pay balance.

**Example Scenarios:**

| Deadline | Use Case                               |
| -------- | -------------------------------------- |
| 30 days  | Strict payment terms (urgent products) |
| 60 days  | Standard grace period                  |
| 90 days  | Flexible payment terms (recommended)   |

**Timeline Example (90-day deadline):**

- Day 1-30: Initial coverage (paid)
- Day 31-120: Grace period (can still pay balance)
- Day 121+: Expired, cannot extend

---

### 8. **Grace Period Days** (Required, Default: 7)

**Input:** Number of days

**Recommended:** 7 days

**What it means:** Extra buffer before late fees apply within the extension deadline.

**Example:**

- Extension deadline: 90 days
- Grace period: 7 days
- Days 1-7: No penalty
- Days 8-90: Late fee applies

---

### 9. **Penalty for Late Extension** (Default: 0.00)

**Input:** Decimal (Percentage)

**Recommended:** 5.00% - 10.00%

**What it means:** Late fee percentage applied to balance amount.

**Calculation Example:**

- Balance amount: KSh 15,000
- Late fee: 5%
- Total if late: KSh 15,000 + (15,000 × 0.05) = **KSh 15,750**

**Graduated Late Fees (Advanced):**
You can configure this in the backend:

- 0-30 days late: 5%
- 31-60 days late: 10%
- 61-90 days late: 15%

---

### 10. **Allow Partial Extension** (Checkbox)

**Default:** Unchecked (False)

**What it means:**

- **Checked**: Client can pay partial balance (e.g., pay KSh 5,000 of KSh 15,000 balance)
- **Unchecked**: Client must pay full balance amount

**Recommendation:** Leave **unchecked** for simplicity

---

### 11. **Cover Note Template** (Optional)

**Input:** Text field

**What it means:** Email template for initial 30-day cover note

**Example:**

```
Dear {client_name},

Your {initial_period_days}-day cover note for {vehicle_registration} is now active.

Coverage: {initial_start_date} to {initial_expiry_date}
Balance Amount: KSh {balance_amount}
Payment Deadline: {extension_deadline_date}

Thank you for choosing PataBima Insurance.
```

---

### 12. **Full Certificate Template** (Optional)

**Input:** Text field

**What it means:** Email template for full 12-month certificate after balance payment

---

### 13. **Extension Reminder Template** (Optional)

**Input:** Text field

**What it means:** Email template for reminding client to pay balance

**Example:**

```
Dear {client_name},

Your cover note for {vehicle_registration} expires in {days_remaining} days.

Balance Amount: KSh {balance_amount}
Deadline: {extension_deadline_date}

Pay now to avoid coverage gaps.
```

---

### 14. **Auto Reminder Schedule** (Optional)

**Input:** JSON field

**What it means:** Automated reminder schedule

**Example:**

```json
[
  { "days_before_deadline": 30, "reminder_type": "email" },
  { "days_before_deadline": 14, "reminder_type": "sms" },
  { "days_before_deadline": 7, "reminder_type": "email+sms" }
]
```

---

## Configuration Examples

### Example 1: Private Third-Party EXT + CIC Insurance

```
Subcategory: PRIVATE_THIRD_PARTY_EXT
Underwriter: CIC Insurance

Initial Period Days: 30
Initial Amount: KSh 5,000.00
Balance Amount: KSh 15,000.00
Total Annual Premium: KSh 20,000.00

Extension Deadline Days: 90
Grace Period Days: 7
Penalty for Late Extension: 5.00%
Allow Partial Extension: No (unchecked)
```

**What this means:**

- Client pays **KSh 5,000** → Gets 30 days coverage
- Client has **90 days** to pay **KSh 15,000** balance
- After balance payment → Full 12-month coverage
- Late payment → **5% penalty** (KSh 750 extra)

---

### Example 2: PSV Matatu 1 Week EXT + AAR Insurance

```
Subcategory: PSV_MATATU_1WK_TP_EXT
Underwriter: AAR Insurance

Initial Period Days: 7
Initial Amount: KSh 2,500.00
Balance Amount: KSh 21,500.00
Total Annual Premium: KSh 24,000.00

Extension Deadline Days: 60
Grace Period Days: 7
Penalty for Late Extension: 7.00%
Allow Partial Extension: No
```

**What this means:**

- Client pays **KSh 2,500** → Gets 7 days coverage (1 week)
- Client has **60 days** to pay **KSh 21,500** balance
- Shorter deadline because PSV is higher risk
- Higher late fee (7%) for commercial vehicles

---

### Example 3: Commercial Own Goods EXT + Jubilee

```
Subcategory: COMMERCIAL_OWN_GOODS_TP_EXT
Underwriter: Jubilee Insurance

Initial Period Days: 30
Initial Amount: KSh 8,000.00
Balance Amount: KSh 24,000.00
Total Annual Premium: KSh 32,000.00

Extension Deadline Days: 90
Grace Period Days: 7
Penalty for Late Extension: 5.00%
Allow Partial Extension: Yes (checked)
```

**What this means:**

- Client pays **KSh 8,000** → Gets 30 days coverage
- Client can pay partial balance (e.g., KSh 10,000 first, KSh 14,000 later)
- More flexible for commercial clients

---

## Pricing Guidelines by Category

### Private Third-Party Extendible

| Component          | Recommended Amount  |
| ------------------ | ------------------- |
| Initial Amount     | KSh 4,000 - 6,000   |
| Balance Amount     | KSh 12,000 - 18,000 |
| Total Annual       | KSh 16,000 - 24,000 |
| Extension Deadline | 90 days             |
| Late Fee           | 5%                  |

---

### Commercial Third-Party Extendible

| Component          | Recommended Amount  |
| ------------------ | ------------------- |
| Initial Amount     | KSh 6,000 - 10,000  |
| Balance Amount     | KSh 18,000 - 30,000 |
| Total Annual       | KSh 24,000 - 40,000 |
| Extension Deadline | 90 days             |
| Late Fee           | 5-7%                |

---

### PSV Third-Party Extendible

| Component          | Recommended Amount  |
| ------------------ | ------------------- |
| Initial Amount     | KSh 5,000 - 8,000   |
| Balance Amount     | KSh 15,000 - 25,000 |
| Total Annual       | KSh 20,000 - 33,000 |
| Extension Deadline | 60-90 days          |
| Late Fee           | 7%                  |

---

### TukTuk Third-Party Extendible

| Component          | Recommended Amount  |
| ------------------ | ------------------- |
| Initial Amount     | KSh 3,000 - 5,000   |
| Balance Amount     | KSh 9,000 - 15,000  |
| Total Annual       | KSh 12,000 - 20,000 |
| Extension Deadline | 90 days             |
| Late Fee           | 5%                  |

---

## Step-by-Step: Creating Your First Configuration

### 1. Login to Admin Panel

Navigate to: `http://localhost:8000/admin/`

### 2. Go to Extendible Pricing

Click: **APP** → **Extendible Pricing** → **Add Extendible Pricing**

### 3. Fill in Required Fields

```
Subcategory: [Select] PRIVATE_THIRD_PARTY_EXT
Underwriter: [Select] CIC Insurance

Initial Period Days: 30
Initial Amount: 5000.00
Balance Amount: 15000.00
Total Annual Premium: 20000.00

Extension Deadline Days: 90
Grace Period Days: 7
Penalty for Late Extension: 5.00
Allow Partial Extension: [Leave unchecked]
```

### 4. Save

Click **"Save"** or **"Save and add another"** to create more configurations

### 5. Verify

Check the list view shows your new configuration:

```
PRIVATE_THIRD_PARTY_EXT | CIC Insurance | KSh 5,000.00 | KSh 20,000.00 | ✓
```

---

## Bulk Configuration Strategy

### Recommended Approach:

**Phase 1: Configure Top 3 Products** (Day 1)

1. Private Third-Party EXT
2. Commercial Own Goods EXT
3. PSV Uber EXT

For all 8 underwriters = **24 records**

**Phase 2: Configure Remaining Products** (Day 2-3)

- Add remaining 8 extendible products
- For all underwriters = **64 more records**

**Total: 88 configurations** (11 products × 8 underwriters)

---

## Maintenance & Updates

### Updating Pricing

1. Navigate to: `http://localhost:8000/admin/app/extendiblepricing/`
2. Click on the configuration you want to edit
3. Update amounts (e.g., increase prices for new year)
4. Click "Save"

**Note:** Changes affect **new policies only**. Existing policies keep original pricing.

### Seasonal Adjustments

You can create multiple configurations with different effective dates:

- Q1 Pricing (Jan-Mar)
- Q2 Pricing (Apr-Jun)
- etc.

---

## Testing Your Configuration

### 1. Check in Admin

Visit: `http://localhost:8000/admin/app/extendiblepricing/`

You should see your configurations listed.

### 2. Test in Frontend

1. Open PataBima mobile app
2. Navigate to Motor 2 Insurance
3. Select "Private" category
4. Select "Private Third-Party EXT" subcategory
5. Fill in vehicle details
6. **Check Premium Calculation screen**:
   - Should show "Payment Plan" toggle
   - Should show "Initial Payment" and "Balance Payment" amounts
   - Should match your admin configuration

### 3. Submit Test Policy

1. Complete the form
2. Select "Installments" payment plan
3. Submit policy
4. Check backend:
   ```python
   python manage.py shell
   >>> from app.models import MotorPolicy
   >>> policy = MotorPolicy.objects.latest('submitted_at')
   >>> policy.extendible_config
   # Should show your configured amounts
   ```

---

## Common Issues & Solutions

### Issue 1: "No pricing configured for this product"

**Cause:** ExtendiblePricing record doesn't exist for selected subcategory + underwriter

**Solution:** Create configuration in admin panel for that combination

---

### Issue 2: Payment plan not showing in frontend

**Cause:** Frontend not detecting extendible product

**Check:**

1. Subcategory code contains 'EXT'? (e.g., `PRIVATE_THIRD_PARTY_EXT`)
2. ExtendiblePricing record exists?

---

### Issue 3: Balance amount calculation wrong

**Cause:** Total annual premium ≠ initial + balance

**Solution:** Ensure: `total_annual_premium = initial_amount + balance_amount`

---

## API Integration

### How Frontend Uses This Configuration

When user selects an extendible product:

1. **Frontend Request:**

   ```javascript
   GET /api/v1/motor2/subcategories/?category=PRIVATE
   ```

2. **Backend Response includes:**

   ```json
   {
     "subcategory_code": "PRIVATE_THIRD_PARTY_EXT",
     "is_extendible": true,
     "extendible_config": {
       "initial_period_days": 30,
       "initial_amount": 5000.0,
       "balance_amount": 15000.0,
       "total_annual_premium": 20000.0,
       "extension_deadline_days": 90
     }
   }
   ```

3. **Frontend displays payment plan UI** with your configured amounts

---

## Summary

### ✅ What You Can Do Now:

1. **Create pricing** for any of the 11 extendible products
2. **Set different pricing** for each underwriter
3. **Configure payment terms** (initial amount, balance, deadlines)
4. **Set late fees** and grace periods
5. **Enable/disable partial payments**

### 📊 Recommended Next Steps:

1. **Create 1 test configuration** (Private TP EXT + CIC)
2. **Test in frontend** (verify payment plan shows correctly)
3. **Create remaining 87 configurations** (or use bulk script)
4. **Monitor usage** and adjust pricing as needed

---

**Questions?** Check the main audit report: `SYSTEM_INTEGRATION_AUDIT_REPORT.md`

---

**Document End**
