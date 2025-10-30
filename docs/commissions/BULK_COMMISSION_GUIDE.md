# BULK COMMISSION MANAGEMENT GUIDE FOR ADMINS

## How to Set Commission for All Agents

### Method 1: Set Default Commission Rates (Recommended)

**Step 1: Create Default Commission Rates**

1. Go to Django Admin → Commission Settings → Default Commission Rates
2. Click "Add Default Commission Rate"
3. Set:
   - **Product Type**: Motor Insurance / Medical / Travel / etc.
   - **Commission Rate**: e.g., 15.00 (for 15%)
   - **Effective Date**: When this rate starts applying
   - **Is Active**: ✓ (checked)
4. Click "Save"

**Step 2: Auto-Apply to New Policies**

- The system will automatically use this rate when creating commissions for new paid policies
- No need to manually set commission for each agent

---

### Method 2: Bulk Apply Commission to Existing Paid Policies

**Step 1: Go to Motor Policies**

1. Navigate to: Django Admin → Motor Policies
2. Filter by: `Payment Status = PAID`

**Step 2: Select All Paid Policies**

1. Check the box at the top to select all policies on the page
2. Or manually select specific policies

**Step 3: Run Bulk Action**

1. In the "Action" dropdown, select: **"Generate commissions for selected policies"**
2. Click "Go"
3. The system will:
   - Create commission records for all agents who sold these policies
   - Use the default commission rate (or 15% if not set)
   - Skip policies that already have commission records

---

### Method 3: Manual Bulk Commission Creation

If you want to set a custom commission rate for all agents for a specific period:

**Step 1: Go to Agent Commission**

1. Navigate to: Django Admin → Agent Commissions

**Step 2: Filter Policies**

1. Filter by date range (e.g., policies from January 2025)
2. Filter by payment status = PAID

**Step 3: Use Bulk Actions**
Available bulk actions:

- **Mark as Paid**: Set commission payment status to PAID for selected records
- **Mark as Approved**: Approve selected commissions for payment
- **Mark as Pending**: Reset to pending status

---

## Quick Reference Table

| Task                                       | Location                              | Action                     |
| ------------------------------------------ | ------------------------------------- | -------------------------- |
| Set default rates for all future policies  | Default Commission Rates → Add        | Set rate + product type    |
| Generate commissions for all paid policies | Motor Policies → Filter PAID → Action | Generate commissions       |
| Pay multiple agents at once                | Agent Commissions → Select → Action   | Mark as Paid               |
| Change commission rate for specific agent  | Agent Commissions → Find agent record | Edit commission_rate field |

---

## Important Notes

1. **Only Paid Policies**: Commissions are only generated for policies with `payment_status = PAID`
2. **No Duplicates**: The system prevents creating duplicate commission records for the same policy
3. **Auto-Calculation**: Commission amount is automatically calculated: `premium × rate ÷ 100`
4. **Payment Tracking**: Each commission has status: Pending → Approved → Paid

---

## Example Scenarios

### Scenario 1: Set 15% commission for all motor insurance

```
1. Go to: Default Commission Rates
2. Add:
   - Product Type: MOTOR_INSURANCE
   - Commission Rate: 15.00
   - Effective Date: Today
   - Is Active: ✓
3. Save
```

Result: All new motor policies will automatically get 15% commission

### Scenario 2: Pay all approved commissions

```
1. Go to: Agent Commissions
2. Filter: Payment Status = APPROVED
3. Select all
4. Action: "Mark as Paid"
5. Go
```

Result: All approved commissions are marked as paid with today's date

### Scenario 3: Generate commissions for January policies

```
1. Go to: Motor Policies
2. Filter:
   - Payment Status = PAID
   - Date Created: January 2025
3. Select all
4. Action: "Generate commissions for selected policies"
5. Go
```

Result: Commission records created for all qualifying January policies

---

## Need Different Rates for Different Agents?

Currently, the system uses a uniform rate. To implement agent-specific rates:

**Option 1: Manual Override**

- After bulk generation, manually edit individual commission records
- Change the `commission_rate` field for specific agents
- The system will recalculate the `commission_amount`

**Option 2: Create Agent Commission Tiers** (requires development)

- Define agent levels: Bronze (10%), Silver (15%), Gold (20%)
- Assign agents to tiers
- Auto-apply tier-specific rates

---

## Contact Support

For questions or custom commission structures, contact the system administrator.
