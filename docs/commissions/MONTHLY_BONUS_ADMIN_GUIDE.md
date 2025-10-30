# Monthly Agent Bonus Admin Guide

## ✅ System Implemented Successfully!

You now have a complete **Monthly Agent Bonus System** with full admin editing capabilities for managing 0.3% commission on all agents' monthly sales.

---

## 🎯 What You Can Do

### 1. **Create Monthly Bonuses**

- Add manually for individual agents
- Auto-generate for all agents in a period
- Recalculate from actual sales data

### 2. **Edit Bonus Rates**

- Default: 0.3% (editable)
- Custom rates per agent or period
- Auto-calculates bonus amount on save

### 3. **Manage Payments**

- Approve bonuses for payment
- Mark as paid with payment dates
- Add payment references
- Track payment status

### 4. **View and Filter**

- Filter by month, year, status
- Search by agent name/code
- Sort by any column
- Export capabilities

---

## 📍 How to Access

### Admin Dashboard:

```
http://127.0.0.1:8000/admin/

User Management Section
  └── Agent Performance & Commission
       └── Monthly Agent Bonuses
```

### Direct Link:

```
http://127.0.0.1:8000/admin/app/monthlyagentbonus/
```

---

## 🎨 Admin Interface Features

### List View Columns:

- **Agent** - Name and agent code
- **Period** - Month and year (e.g., "October 2025")
- **Total Policies** - Number of ACTIVE policies sold
- **Total Premium** - Total premium from all sales (in KSh)
- **Bonus Rate** - Percentage rate (default 0.3%)
- **Bonus Amount** - Calculated bonus (highlighted in green)
- **Payment Status** - PENDING / APPROVED / PAID
- **Payment Date** - When bonus was paid

### Filters (Right Sidebar):

- **Payment Status** - Filter by PENDING, APPROVED, PAID
- **Year** - Filter by year (2024, 2025, etc.)
- **Month** - Filter by month (1-12)
- **Payment Date** - Filter by payment date range

### Search:

- Agent email
- Agent phone
- Agent code
- Agent name
- Period (e.g., "2025-10")
- Payment reference

---

## 🔧 Admin Actions (Bulk Operations)

### 1. **Recalculate from Sales Data** ⚡

**What it does**: Updates bonus records from actual ACTIVE policy sales

**How to use**:

1. Select one or more bonus records
2. Choose "Recalculate from Sales Data" from Actions dropdown
3. Click "Go"
4. System fetches all ACTIVE policies in the period
5. Calculates total premium
6. Updates total_policies, total_premium, and bonus_amount

**Example**:

```
Agent: John Doe
Period: October 2025
Before: Total Premium = KSh 0.00, Bonus = KSh 0.00
After: Total Premium = KSh 500,000.00, Bonus = KSh 1,500.00
```

---

### 2. **Mark as Approved** ✅

**What it does**: Approves bonuses for payment processing

**How to use**:

1. Select bonuses to approve
2. Choose "Mark as Approved"
3. Click "Go"
4. Status changes: PENDING → APPROVED

**Use when**: After reviewing and confirming bonus calculations

---

### 3. **Mark as Paid** 💰

**What it does**: Marks bonuses as paid with today's date

**How to use**:

1. Select paid bonuses
2. Choose "Mark as Paid"
3. Click "Go"
4. Status changes: APPROVED → PAID
5. Payment date auto-set to today

**Use when**: After making actual M-PESA/bank payments

---

### 4. **Generate Bonuses for All Agents** 🚀

**What it does**: Auto-creates bonus records for all agents in selected periods

**How to use**:

1. Select one or more existing bonus records (to determine periods)
2. Choose "Generate Bonuses for All Agents (Selected Periods)"
3. Click "Go"
4. System creates bonuses for all agents with sales in those periods

**Example Workflow**:

1. Create a bonus for October 2025 (any agent)
2. Select it
3. Use "Generate for All Agents"
4. Creates bonuses for all agents with October 2025 sales

---

## 📝 How to Add a Monthly Bonus (Manual)

### Method 1: Add from Bonus List

**Step 1**: Navigate to Monthly Agent Bonuses

```
Admin → User Management → Monthly Agent Bonuses → ADD MONTHLY AGENT BONUS
```

**Step 2**: Fill the Form

#### Agent & Period:

- **Agent**: Select agent from dropdown
- **Year**: Enter year (e.g., 2025)
- **Month**: Enter month (1-12)
- **Period**: Auto-filled (readonly)

#### Sales Summary:

- **Total Policies**: Enter manually OR leave at 0 and use "Recalculate"
- **Total Premium**: Enter total premium in KSh

#### Bonus Calculation:

- **Bonus Rate**: Enter rate (default 0.30 for 0.3%)
- **Bonus Amount**: Auto-calculated on save (readonly)

#### Payment Tracking:

- **Payment Status**: Select PENDING (default)
- **Payment Date**: Leave blank initially
- **Payment Reference**: Leave blank
- **Notes**: Optional notes

**Step 3**: Save

- Click "Save" or "Save and continue editing"
- Bonus amount calculates automatically

---

### Method 2: Auto-Generate End of Month

**Best Practice**: Use this method at the end of each month!

**Step 1**: Create One Bonus Record

- Create a bonus for current month (any agent)
- Year: 2025, Month: 10 (for October)

**Step 2**: Select It and Generate for All

- Check the box next to it
- Action: "Generate Bonuses for All Agents (Selected Periods)"
- Click "Go"

**Step 3**: Review Generated Bonuses

- View all created bonuses
- System auto-calculated from ACTIVE policies
- All bonuses start with PENDING status

**Step 4**: Recalculate if Needed

- Select all bonuses
- Action: "Recalculate from Sales Data"
- Click "Go" (ensures latest data)

---

## 💡 Typical Monthly Workflow

### End of Month Process:

#### Day 1: Generate Bonuses

```
1. Navigate to Monthly Agent Bonuses
2. Click "ADD MONTHLY AGENT BONUS"
3. Fill:
   - Agent: Any agent
   - Year: 2025
   - Month: 10 (October)
4. Save

5. Select the created bonus
6. Action: "Generate Bonuses for All Agents"
7. Click "Go"

Result: All agents with October sales have bonuses created
```

#### Day 2: Review and Verify

```
1. Filter: Month = 10, Year = 2025
2. Review each bonus:
   - Check Total Policies count
   - Verify Total Premium amounts
   - Confirm Bonus Amount calculations
3. If needed, select all and "Recalculate from Sales Data"
```

#### Day 3: Approve for Payment

```
1. Filter: Payment Status = PENDING
2. Select bonuses to approve
3. Action: "Mark as Approved"
4. Click "Go"

Result: Bonuses ready for payment processing
```

#### Day 4-5: Process Payments

```
1. Go to accounting/finance
2. Process M-PESA/bank transfers to agents
3. Note payment references
4. Return to admin
```

#### Day 6: Update Payment Records

```
1. Filter: Payment Status = APPROVED
2. For each paid bonus:
   - Click to edit
   - Add payment_reference (M-PESA code, etc.)
   - Save
3. Select all paid bonuses
4. Action: "Mark as Paid"
5. Click "Go"

Result: Complete payment tracking
```

---

## 🎯 Bonus Calculation Examples

### Example 1: Basic Calculation

```
Agent: Jane Smith
Month: October 2025
Total Policies: 15
Total Premium: KSh 800,000.00
Bonus Rate: 0.30%

Calculation:
Bonus Amount = (800,000 × 0.30) ÷ 100
Bonus Amount = 240,000 ÷ 100
Bonus Amount = KSh 2,400.00
```

### Example 2: Custom Rate

```
Agent: Top Performer
Month: October 2025
Total Premium: KSh 1,500,000.00
Bonus Rate: 0.50% (custom higher rate)

Calculation:
Bonus Amount = (1,500,000 × 0.50) ÷ 100
Bonus Amount = KSh 7,500.00
```

### Example 3: Low Sales

```
Agent: New Agent
Month: October 2025
Total Premium: KSh 50,000.00
Bonus Rate: 0.30%

Calculation:
Bonus Amount = (50,000 × 0.30) ÷ 100
Bonus Amount = KSh 150.00
```

---

## 🔍 Searching and Filtering

### Find All October 2025 Bonuses:

```
1. Filter: Month = 10
2. Filter: Year = 2025
3. View list
```

### Find Pending Bonuses:

```
1. Filter: Payment Status = PENDING
2. View list
```

### Find Specific Agent's Bonuses:

```
1. Search: Enter agent code or email
2. View results
```

### Find Bonuses for Payment:

```
1. Filter: Payment Status = APPROVED
2. View list
3. Select all
4. Mark as Paid
```

---

## ✏️ Editing Bonus Rates

### Change Individual Bonus Rate:

**Step 1**: Find the Bonus

- Navigate to Monthly Agent Bonuses
- Click on the bonus to edit

**Step 2**: Edit Rate

- Scroll to "Bonus Calculation" section
- Change **Bonus Rate** (e.g., from 0.30 to 0.50)
- Don't change Bonus Amount (auto-calculated)

**Step 3**: Save

- Click "Save"
- Bonus amount recalculates automatically

**Example**:

```
Before:
Premium: KSh 500,000
Rate: 0.30%
Bonus: KSh 1,500

After (changed to 0.50%):
Premium: KSh 500,000
Rate: 0.50%
Bonus: KSh 2,500 (auto-calculated)
```

---

## 📊 Reporting

### Monthly Bonus Report:

**Step 1**: Filter by Period

```
1. Filter: Month = 10, Year = 2025
2. Filter: Payment Status = (leave empty for all)
```

**Step 2**: View Summary

- See all agents and their bonuses
- Total count visible at bottom
- Export to CSV/Excel (future feature)

**Step 3**: Calculate Totals

- Manually sum bonus amounts
- Or export and use spreadsheet

### Agent Bonus History:

**Step 1**: Search Agent

```
1. Search: agent@example.com
2. View all bonuses for this agent
```

**Step 2**: Review History

- See bonuses across all months
- Check payment history
- Verify calculations

---

## 🚨 Common Tasks

### Task 1: Create November 2025 Bonuses

```
1. Add new bonus:
   - Agent: Any agent
   - Year: 2025
   - Month: 11
   - Save

2. Select it
3. Action: "Generate Bonuses for All Agents"
4. Click "Go"

5. Select all generated
6. Action: "Recalculate from Sales Data"
7. Click "Go"

Done! ✅
```

---

### Task 2: Approve All October Bonuses

```
1. Filter: Month = 10, Year = 2025
2. Filter: Payment Status = PENDING
3. Select all (checkbox at top)
4. Action: "Mark as Approved"
5. Click "Go"

Done! ✅
```

---

### Task 3: Pay Approved Bonuses

```
1. Filter: Payment Status = APPROVED
2. Process payments externally
3. Return to admin
4. Select all approved
5. Action: "Mark as Paid"
6. Click "Go"
7. Edit each to add payment reference

Done! ✅
```

---

### Task 4: Check Total Bonuses for October

```
1. Filter: Month = 10, Year = 2025
2. View list
3. Note count at bottom
4. Manually sum amounts or export

Example Output:
"45 monthly agent bonuses"
Total: ~KSh 67,500 (if 15 agents × ~KSh 4,500 average)
```

---

## 🎓 Training Guide for Admins

### Week 1: Learn the Basics

- Create manual bonuses
- Edit rates
- Understand auto-calculation

### Week 2: Master Auto-Generation

- Generate for all agents
- Recalculate from sales
- Review generated bonuses

### Week 3: Payment Workflow

- Approve bonuses
- Mark as paid
- Add payment references

### Week 4: Monthly Process

- End-of-month generation
- Full payment workflow
- Reporting and verification

---

## ✅ Best Practices

### Do's:

✅ Generate bonuses at end of each month
✅ Recalculate before approving
✅ Review all bonuses before approval
✅ Add payment references after payment
✅ Keep notes for special cases
✅ Use filters to stay organized

### Don'ts:

❌ Don't manually edit bonus amounts (auto-calculated)
❌ Don't skip recalculation step
❌ Don't approve without review
❌ Don't forget payment references
❌ Don't create duplicate bonuses (unique constraint)

---

## 🔥 Quick Reference

| Task             | Steps                           |
| ---------------- | ------------------------------- |
| **Add Manual**   | Add → Fill Form → Save          |
| **Generate All** | Add One → Select → Generate All |
| **Recalculate**  | Select → Recalculate → Go       |
| **Approve**      | Select → Mark Approved → Go     |
| **Mark Paid**    | Select → Mark Paid → Go         |
| **Edit Rate**    | Click Bonus → Edit Rate → Save  |
| **Find Agent**   | Search: agent code/email        |
| **Filter Month** | Filter: Month + Year            |

---

## 🎉 Summary

You now have a **fully functional Monthly Agent Bonus System** with:

✅ **Full admin interface** for creating and editing bonuses  
✅ **Auto-generation** from sales data  
✅ **Flexible bonus rates** (default 0.3%, editable per agent)  
✅ **Complete payment workflow** (Pending → Approved → Paid)  
✅ **Bulk operations** for efficiency  
✅ **Search and filtering** for organization  
✅ **Auto-calculation** of bonus amounts  
✅ **Payment tracking** with dates and references

**The system is ready to use!** 🚀

---

**Last Updated**: October 10, 2025  
**Status**: ✅ Production Ready  
**Location**: Admin → User Management → Monthly Agent Bonuses
