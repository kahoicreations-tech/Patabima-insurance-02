# Admin Commission Management - Complete Guide

## 📚 Table of Contents

1. [Three Ways to Add Commissions](#three-ways-to-add-commissions)
2. [Commission Workflow](#commission-workflow)
3. [Step-by-Step Instructions](#step-by-step-instructions)
4. [Managing Payments](#managing-payments)
5. [Reports and Analytics](#reports-and-analytics)
6. [Troubleshooting](#troubleshooting)

---

## Three Ways to Add Commissions

### Method 1: Auto-Generate (FASTEST) ⚡

**Best for**: Multiple commissions, paid policies  
**Time**: 30 seconds for bulk creation  
**Automation**: Full auto-calculation

```
Motor Policies → Filter ACTIVE → Select → Generate Commissions
```

**Advantages**:

- ✅ Bulk creation (select multiple policies)
- ✅ Auto-extracts agent from policy
- ✅ Auto-extracts premium from policy
- ✅ Default 15% commission rate
- ✅ Skips duplicates automatically
- ✅ One-click operation

**When to Use**:

- End of month commission processing
- Bulk commission generation
- Standard 15% commission rate
- Paid policies with complete data

---

### Method 2: Manual Entry ✏️

**Best for**: Custom rates, special cases  
**Time**: 2 minutes per commission  
**Control**: Full manual control

```
Agent Commissions → Add Agent Commission → Fill Form → Save
```

**Advantages**:

- ✅ Custom commission rates
- ✅ Special commission cases
- ✅ Add notes and details
- ✅ Set payment status immediately
- ✅ Manual premium override

**When to Use**:

- Non-standard commission rates
- Special bonus commissions
- Manual policy commissions
- Custom arrangements

---

### Method 3: From Agent Profile 👤

**Best for**: Quick addition, agent-specific  
**Time**: 1 minute  
**Context**: Agent-focused workflow

```
Users → Select Agent → Commissions Section → Add Inline → Save
```

**Advantages**:

- ✅ Agent context visible
- ✅ See existing commissions
- ✅ Quick inline addition
- ✅ View totals immediately

**When to Use**:

- Reviewing agent profile
- Adding one-off commission
- Quick agent-specific entry
- Verifying agent commissions

---

## Commission Workflow

### Complete Process Flow

```
┌─────────────────────┐
│  Policy ACTIVE      │ ← Policy payment confirmed
│  (Paid Policy)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Generate Commission │ ← Admin creates commission
│  Status: PENDING    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Review & Approve    │ ← Admin reviews and approves
│  Status: APPROVED   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Process Payment     │ ← Make M-PESA/Bank transfer
│  (External System)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Mark as Paid        │ ← Update status + reference
│  Status: PAID       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Agent Receives      │ ← Commission completed
│  Payment            │
└─────────────────────┘
```

### Status Definitions

| Status       | Meaning                             | Next Action      |
| ------------ | ----------------------------------- | ---------------- |
| **PENDING**  | Commission created, awaiting review | Admin reviews    |
| **APPROVED** | Approved for payment processing     | Process payment  |
| **PAID**     | Payment completed and sent          | None (completed) |
| **DISPUTED** | Issue with commission               | Resolve issue    |

---

## Step-by-Step Instructions

### A. Auto-Generate Commissions (Recommended)

#### Step 1: Navigate to Motor Policies

```
Admin Dashboard
  └── Motor Insurance
       └── Motor Policies (click)
```

#### Step 2: Filter for Paid Policies

In the right sidebar:

- **Status**: Click "ACTIVE"
- **Cover start date**: (Optional) Select date range

You should see only paid policies (status = ACTIVE).

#### Step 3: Select Policies

- Click checkbox next to each policy
- OR click checkbox in header to select all visible

Example:

```
☑️ Policy #POL-2025-001 | ACTIVE | Agent: John Doe
☑️ Policy #POL-2025-002 | ACTIVE | Agent: Jane Smith
☑️ Policy #POL-2025-003 | ACTIVE | Agent: John Doe
```

#### Step 4: Run Action

At the top of the list:

- **Action dropdown**: Select "Generate commissions for selected policies"
- Click **"Go"** button

#### Step 5: Review Results

Success message appears:

```
Successfully created 3 commission(s).
Skipped 0 duplicate(s).
0 error(s).
```

#### Step 6: Verify Commissions Created

Navigate to:

```
User Management → Agent Commissions
```

You should see new commissions with:

- Agent name
- Policy number
- Premium amount (from policy)
- Commission rate: 15.00%
- Commission amount (calculated)
- Payment status: PENDING

---

### B. Manual Commission Entry

#### Step 1: Open Add Form

```
Admin Dashboard
  └── User Management
       └── Agent Commissions
            └── ADD AGENT COMMISSION (button)
```

#### Step 2: Fill Agent & Sale Section

- **Agent**: Click dropdown, select agent
  - Shows: email or phone number
  - Only users with agent profile shown
- **Policy**: Click dropdown, select policy
  - Shows: Policy numbers
  - Choose ACTIVE policies only

Example:

```
Agent: john@example.com
Policy: Policy #POL-2025-001
```

#### Step 3: Fill Commission Details

- **Premium Amount**: Enter total premium
  - Format: 20000.00 (no commas)
  - Currency: KSh (Kenyan Shillings)
- **Commission Rate**: Enter percentage
  - Format: 15.00 (for 15%)
  - Standard: 15.00
  - Range: 10.00 - 20.00
- **Commission Amount**: (Auto-calculated, readonly)
  - Calculated on save
  - Formula: (Premium × Rate) / 100

Example:

```
Premium Amount: 20000.00
Commission Rate: 15.00
Commission Amount: 3000.00 (auto-fills on save)
```

#### Step 4: Fill Payment Tracking (Optional)

- **Payment Status**: Select from dropdown
  - PENDING (default for new commissions)
  - APPROVED (if pre-approved)
  - PAID (if already paid - rare)
  - DISPUTED (if there's an issue)
- **Payment Date**: Leave blank for PENDING
  - Auto-filled when using "Mark as Paid" action
- **Payment Reference**: Leave blank initially
  - Add after payment (M-PESA code, etc.)
- **Notes**: Add any additional information
  - Example: "Special promotion commission"

#### Step 5: Save

Click **"Save"** or **"Save and add another"**

Commission amount calculates automatically.

#### Step 6: Verify

Check the commission list to verify:

- Commission appears in list
- Amount calculated correctly
- Status shows correctly

---

### C. Add from Agent Profile

#### Step 1: Find Agent

```
Admin Dashboard
  └── User Management
       └── Users
            └── [Click Agent Name]
```

Search tips:

- Use search bar (email, phone, agent code)
- Filter by role: "Agents"

#### Step 2: Scroll to Commissions Section

On agent detail page, scroll down to find:

```
┌─────────────────────────────────┐
│ COMMISSIONS                     │
│ ─────────────────────────────── │
│ [Existing commissions shown]    │
│                                 │
│ [Add another Commission] ←Click │
└─────────────────────────────────┘
```

#### Step 3: Fill Inline Form

A new row appears:

- **Policy**: Select from dropdown
- **Premium Amount**: Enter amount
- **Commission Rate**: Enter percentage
- **Payment Status**: Select status
- **Payment Date**: (Optional)
- **Payment Reference**: (Optional)
- **Notes**: (Optional)

#### Step 4: Save User

Scroll to bottom, click **"Save"**

Commission saves with the user.

#### Step 5: Verify in Commission Summary

At the top of the agent page, check:

```
┌─────────────────────────────────┐
│ COMMISSION SUMMARY              │
│ ─────────────────────────────── │
│ Total Earned: KSh 15,000.00     │
│ Pending: KSh 3,000.00           │ ← Should increase
│ Paid: KSh 12,000.00             │
│ Transactions: 5                 │ ← Should increase
└─────────────────────────────────┘
```

---

## Managing Payments

### Approve Commissions for Payment

#### Step 1: View Pending Commissions

```
User Management → Agent Commissions
```

Filter by **Payment Status**: PENDING

#### Step 2: Review Commissions

Check each commission:

- Verify agent is correct
- Verify premium amount matches policy
- Verify commission rate is appropriate
- Check for any notes/issues

#### Step 3: Select for Approval

- Click checkboxes for commissions to approve
- Can select multiple at once

#### Step 4: Approve

- **Action dropdown**: Select "Mark as Approved"
- Click **"Go"**

Success message: "X commissions approved."

Status changes: PENDING → APPROVED

---

### Process Payments (External)

After approving commissions, process actual payments:

#### M-PESA Payments:

1. Log into M-PESA business portal
2. Process payment to agent's M-PESA number
3. Note the M-PESA transaction code

#### Bank Transfer:

1. Log into online banking
2. Transfer to agent's bank account
3. Note the bank reference number

#### Cash Payment:

1. Prepare cash amount
2. Agent signs receipt
3. Note receipt number

---

### Mark Commissions as Paid

#### Step 1: View Approved Commissions

```
User Management → Agent Commissions
```

Filter by **Payment Status**: APPROVED

#### Step 2: Select Paid Commissions

- Click checkboxes for commissions that were paid

#### Step 3: Mark as Paid

- **Action dropdown**: Select "Mark as Paid"
- Click **"Go"**

Success message: "X commissions marked as paid."

**Auto-updates**:

- Status: APPROVED → PAID
- Payment Date: Set to today's date

#### Step 4: Add Payment References

For each paid commission:

1. Click commission to edit
2. Scroll to **Payment Tracking** section
3. **Payment Reference**: Enter M-PESA code or bank ref
4. Click **"Save"**

Example:

```
Payment Reference: MPE123456789
```

---

## Reports and Analytics

### View Individual Agent Commissions

#### Method 1: From User Profile

```
Users → [Click Agent] → View Summary
```

Shows:

```
COMMISSION SUMMARY
──────────────────
Total Earned: KSh 45,000.00
Pending: KSh 5,000.00
Paid: KSh 40,000.00
Transactions: 15
```

Plus inline list of all commissions.

#### Method 2: From Commission List

```
Agent Commissions → Search for agent
```

Search by:

- Agent email
- Agent phone
- Agent code

---

### Commission Statistics

#### Filter Options (Sidebar):

- **Payment Status**: PENDING, APPROVED, PAID, DISPUTED
- **Payment Date**: Date ranges
- **Date Created**: When commission was created
- **Commission Rate**: Filter by rate (10%, 15%, etc.)

#### Search Options:

- Agent email
- Agent phone number
- Agent code
- Payment reference

#### Export Options:

- Select commissions
- **Action**: "Export user report" (coming soon)

---

### Monthly Commission Reports

#### Step 1: Filter by Date

```
Agent Commissions → Filter → Date Created
```

Select:

- "This month"
- "Last 7 days"
- "Custom range"

#### Step 2: Group by Status

View counts:

- PENDING: X commissions, KSh XX,XXX
- APPROVED: X commissions, KSh XX,XXX
- PAID: X commissions, KSh XX,XXX

#### Step 3: Export (Manual)

Currently:

- Copy data manually
- Or use browser print to PDF

Future:

- Excel export
- PDF reports
- Automated monthly summaries

---

## Troubleshooting

### Issue 1: "No commissions created"

**Symptoms**:

- Selected policies but no commissions generated
- Error message or zero created

**Possible Causes & Solutions**:

1. **Policies not ACTIVE**

   - Solution: Filter for status = ACTIVE only
   - Check: Policy status must be "ACTIVE" (paid)

2. **No agent on policy**

   - Solution: Ensure policy.quotation.user exists
   - Check: View policy details, verify agent field

3. **Agent has no profile**

   - Solution: Create staff_user_profile for agent
   - Check: User must have agent_code

4. **No premium data**

   - Solution: Ensure policy has premium_breakdown
   - Check: Policy must have valid premium amount

5. **Duplicate commissions**
   - Solution: Commissions already exist
   - Check: View agent commissions, filter by policy

---

### Issue 2: "Commission amount not calculating"

**Symptoms**:

- Commission amount shows 0.00
- Amount doesn't change after saving

**Solutions**:

1. **Save the record first**

   - Calculation happens in save() method
   - Click Save, then check amount

2. **Verify both fields filled**

   - Premium amount must be > 0
   - Commission rate must be > 0

3. **Check field formats**

   - Premium: 20000.00 (not 20,000)
   - Rate: 15.00 (not 15%)

4. **Manual recalculation**
   - Formula: (Premium × Rate) ÷ 100
   - Example: (20000 × 15) ÷ 100 = 3000

---

### Issue 3: "Agent not in dropdown"

**Symptoms**:

- Can't find agent when selecting
- Dropdown shows no results

**Solutions**:

1. **Verify user is agent**

   ```
   Users → View user → Check:
   - Has staff_user_profile
   - Has agent_code
   - Role shows "Agent"
   ```

2. **Check user is active**

   - User must have is_active = True
   - Check "Active" checkbox on user

3. **Search correctly**
   - Type email or phone number
   - Dropdown filters as you type

---

### Issue 4: "Policy not in dropdown"

**Symptoms**:

- Can't find policy when selecting
- No policies appear

**Solutions**:

1. **Verify policy is ACTIVE**

   ```
   Motor Policies → Check policy:
   - Status = ACTIVE
   - Has policy_number
   ```

2. **Check policy exists**

   - Policy must be in database
   - Search by policy number

3. **Policy already has commission**
   - Each policy can have multiple commissions
   - But auto-generate skips duplicates

---

### Issue 5: "Wrong commission amount"

**Symptoms**:

- Amount doesn't match expected
- Calculation seems incorrect

**Solutions**:

1. **Verify rate is correct**

   - Check commission_rate field
   - Should be 15.00 for 15%
   - NOT 0.15 or 15 without decimals

2. **Verify premium correct**

   - Check premium_amount field
   - Should match policy total_payable
   - Extract from policy if needed

3. **Recalculate manually**

   ```
   Premium: 20000.00
   Rate: 15.00%
   Amount = (20000 × 15) ÷ 100 = 3000.00
   ```

4. **Edit and resave**
   - Edit commission
   - Adjust rate if needed
   - Save (recalculates automatically)

---

## Best Practices

### ✅ Do's

1. **Always use auto-generate for bulk**

   - Faster and more accurate
   - Prevents manual errors
   - Skips duplicates automatically

2. **Filter for ACTIVE policies only**

   - Only paid policies get commissions
   - Prevents commission on unpaid policies

3. **Review before approving**

   - Check amounts are correct
   - Verify agents are correct
   - Look for anomalies

4. **Add payment references**

   - After marking as paid
   - Include M-PESA code or bank ref
   - Helps with reconciliation

5. **Use bulk actions**

   - Approve multiple at once
   - Mark multiple as paid together
   - Saves time

6. **Check agent summaries**
   - Verify totals make sense
   - Compare with payment records
   - Ensure accuracy

### ❌ Don'ts

1. **Don't create for DRAFT policies**

   - Commissions only for paid (ACTIVE)
   - Wait until payment confirmed

2. **Don't manually calculate amounts**

   - System calculates automatically
   - Manual entry causes errors

3. **Don't skip payment references**

   - Always add after payment
   - Critical for auditing

4. **Don't create duplicates**

   - Check existing commissions first
   - System prevents but verify

5. **Don't forget to approve**

   - Don't go straight to PAID
   - Follow workflow: PENDING → APPROVED → PAID

6. **Don't ignore disputed status**
   - Investigate issues promptly
   - Resolve before payment

---

## Quick Reference Card

| Task                 | Path                                    | Action                       |
| -------------------- | --------------------------------------- | ---------------------------- |
| **Auto-generate**    | Motor Policies → Filter ACTIVE → Select | Action: Generate commissions |
| **Manual add**       | Agent Commissions → Add                 | Fill form → Save             |
| **From profile**     | Users → Agent → Commissions             | Add inline → Save user       |
| **Approve**          | Agent Commissions → Filter PENDING      | Select → Mark as Approved    |
| **Mark paid**        | Agent Commissions → Filter APPROVED     | Select → Mark as Paid        |
| **Add reference**    | Agent Commissions → Click commission    | Edit payment reference       |
| **View summary**     | Users → Click agent                     | See Commission Summary       |
| **Filter by status** | Agent Commissions                       | Sidebar → Payment Status     |
| **Search agent**     | Agent Commissions                       | Search → Agent email/code    |
| **Monthly report**   | Agent Commissions                       | Filter → Date Created        |

---

## Support

### Need More Help?

1. **Quick Start**: See `QUICK_START_COMMISSIONS.md`
2. **Detailed Guide**: See `HOW_TO_ADD_COMMISSIONS.md`
3. **User Management**: See `USER_MANAGEMENT_ADMIN_SPEC.md`
4. **Technical Issues**: Contact system administrator

---

**Document Version**: 1.0  
**Last Updated**: October 10, 2025  
**For**: PataBima Admin Users  
**System**: Django Admin - User Management Module
