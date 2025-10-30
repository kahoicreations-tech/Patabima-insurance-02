# Quick Start Guide: Adding Commissions (Admin)

## 🚀 Fastest Way to Add Commissions

### Option 1: Auto-Generate from Paid Policies (RECOMMENDED) ⚡

**Time**: ~30 seconds for multiple commissions

1. **Go to Motor Policies**

   ```
   Admin Dashboard → Motor Insurance → Motor Policies
   ```

2. **Filter for Paid Policies**

   - Click "ACTIVE" in the Status filter (sidebar)
   - Optional: Select date range

3. **Select Policies**

   - ☑️ Check boxes next to policies
   - Or check top box to select all visible

4. **Generate Commissions**

   - Action dropdown: Select **"Generate commissions for selected policies"**
   - Click **"Go"**

5. **Done!** ✅
   - Commissions created automatically
   - Default rate: 15%
   - Status: PENDING
   - Premium extracted from policy

**What Gets Created:**

- Agent: Extracted from policy quotation
- Premium: From policy.premium_breakdown
- Rate: 15% (default)
- Amount: Auto-calculated
- Status: PENDING

---

### Option 2: Manual Entry (For Special Cases) ✏️

**Time**: ~2 minutes per commission

1. **Go to Commissions**

   ```
   Admin Dashboard → User Management → Agent Commissions
   ```

2. **Click "ADD AGENT COMMISSION"** (top right)

3. **Fill Quick Form:**

   ```
   Agent:           [Select agent from dropdown]
   Policy:          [Select ACTIVE policy]
   Premium Amount:  20000.00
   Commission Rate: 15.00
   Payment Status:  PENDING
   ```

4. **Click "SAVE"**
   - Commission amount auto-calculates
   - Ready for approval

---

### Option 3: From Agent Profile (Quick Add) 👤

**Time**: ~1 minute

1. **Go to Users**

   ```
   Admin Dashboard → User Management → Users
   ```

2. **Click Agent Name**

3. **Scroll to "COMMISSIONS" Section**

4. **Click "Add another Commission"**

5. **Fill Inline:**

   - Policy: [Select]
   - Premium: 20000.00
   - Rate: 15.00

6. **Save User** (bottom button)

---

## 💰 Payment Workflow

### Step 1: Review Pending Commissions

```
User Management → Agent Commissions → Filter: Status = PENDING
```

### Step 2: Approve Commissions

```
☑️ Select commissions
Action: "Mark as Approved"
Click "Go"
```

### Step 3: Make Payments

- Process actual M-PESA/Bank transfers
- Note payment references

### Step 4: Mark as Paid

```
☑️ Select paid commissions
Action: "Mark as Paid"
Click "Go"
```

### Step 5: Add References

- Click commission
- Add payment reference
- Save

---

## 📊 Quick Stats

### View Agent Commissions:

```
Users → [Click Agent] → See "Commission Summary" box
```

Shows:

- Total Earned: KSh XX,XXX
- Pending: KSh XX,XXX
- Paid: KSh XX,XXX
- Transactions: XX

### View All Commissions:

```
Agent Commissions → See list with filters
```

Filter by:

- Payment Status
- Date Range
- Commission Rate

---

## ✅ Quick Reference

| Task          | Navigation                             | Time |
| ------------- | -------------------------------------- | ---- |
| Auto-generate | Motor Policies → Select → Action       | 30s  |
| Manual add    | Agent Commissions → Add                | 2min |
| Approve       | Agent Commissions → Select → Approve   | 10s  |
| Mark paid     | Agent Commissions → Select → Mark Paid | 10s  |
| View summary  | Users → Click Agent                    | 5s   |

---

## 🎯 Pro Tips

1. **Always use Auto-Generate** for multiple commissions
2. **Filter ACTIVE policies** before generating
3. **Bulk approve** before payment processing
4. **Add payment references** after marking as paid
5. **Review agent profile** to verify totals

---

## 🚨 Quick Troubleshooting

**No commissions created?**
→ Check policies are ACTIVE status

**Agent not in dropdown?**
→ Verify user has agent profile

**Wrong amount?**
→ Edit commission, adjust rate, save (auto-recalculates)

**Duplicate commission?**
→ System skips duplicates automatically

---

## 📱 Screenshots Guide

### Screen 1: Motor Policies

![Motor Policies List]

- Shows policy list
- Status filter highlighted
- Select checkboxes
- Action dropdown visible

### Screen 2: Generate Action

![Generate Commissions]

- Action selected
- Go button
- Success message

### Screen 3: Commission List

![Agent Commissions]

- Created commissions
- PENDING status
- Agent names
- Amounts calculated

### Screen 4: Agent Profile

![User Profile]

- Commission summary box
- Total earned
- Inline commissions list

---

**Need detailed instructions?** See `HOW_TO_ADD_COMMISSIONS.md`

**Last Updated**: October 10, 2025  
**Version**: Quick Start v1.0
