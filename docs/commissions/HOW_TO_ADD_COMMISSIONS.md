# How Admins Can Add Commissions

## 📋 Overview

Admins can add commission records for agents in two ways:

1. **Manual Entry** - Through the Admin Interface
2. **Automatic Creation** - Generate from paid policies (recommended)

---

## Method 1: Manual Commission Entry

### Step-by-Step Instructions:

1. **Access Admin Dashboard**

   - Go to http://127.0.0.1:8000/admin/
   - Log in with admin credentials

2. **Navigate to Commissions**

   - Click on **"User Management"** section (first section)
   - Click on **"Agent Commissions"**

3. **Click "Add Agent Commission"** (Top right button)

4. **Fill in the Form:**

   **Agent & Sale Section:**

   - **Agent**: Select the agent from the dropdown

     - Shows agents with their email/phone
     - Only users with agent role should be selected

   - **Policy**: Select the paid policy
     - Choose from MotorPolicy records
     - Only select policies with status = 'ACTIVE' (paid policies)

   **Commission Details Section:**

   - **Premium Amount**: Enter the total premium (e.g., 15000.00)

     - This should match the policy's total premium
     - Currency: KSh (Kenyan Shillings)

   - **Commission Rate**: Enter the commission percentage (e.g., 15.00)

     - Default is typically 15%
     - Can vary by product or agent level

   - **Commission Amount**: Auto-calculated (readonly)
     - Formula: (Premium Amount × Commission Rate) / 100
     - Example: (15000 × 15) / 100 = 2250.00

   **Payment Tracking Section:**

   - **Payment Status**: Select status

     - PENDING - Commission not yet processed (default)
     - APPROVED - Commission approved for payment
     - PAID - Commission already paid to agent
     - DISPUTED - There's an issue with the commission

   - **Payment Date**: (Optional) Date when commission was paid

     - Auto-filled when using "Mark as Paid" action

   - **Payment Reference**: (Optional) Transaction reference

     - M-PESA code, bank transfer reference, etc.

   - **Notes**: (Optional) Additional information

5. **Save the Commission**
   - Click **"Save"** or **"Save and continue editing"**
   - Commission amount is automatically calculated on save

### Example:

```
Agent: John Doe (john@example.com)
Policy: Policy #POL-2025-001
Premium Amount: KSh 20,000.00
Commission Rate: 15.00%
Commission Amount: KSh 3,000.00 (auto-calculated)
Payment Status: PENDING
```

---

## Method 2: Generate Commissions from Paid Policies (RECOMMENDED)

This method allows admins to automatically create commission records from existing paid policies.

### Step-by-Step:

1. **Navigate to Motor Policies**

   - Go to Admin Dashboard
   - Click **"Motor Insurance"** section
   - Click **"Motor Policies"**

2. **Filter for Paid Policies**

   - Use the filter sidebar to select:
     - Status: ACTIVE (paid policies only)
     - Date range: Select period

3. **Select Policies**

   - Check the box next to each policy you want to create commissions for
   - Or check the box at the top to select all

4. **Use Bulk Action**

   - From the "Action" dropdown, select **"Generate Commissions for Selected Policies"**
   - Click **"Go"**

5. **Confirm**

   - System will:
     - Check if commission already exists for each policy
     - Extract agent from policy
     - Extract premium from policy.premium_breakdown
     - Apply default commission rate (15%)
     - Create commission records with status PENDING

6. **Success Message**
   - You'll see: "Successfully created X commissions for agents"
   - Duplicate commissions are skipped automatically

---

## Method 3: From User Profile (Quick Add)

1. **Navigate to User Management → Users**

2. **Click on an Agent's Profile**

   - Select an agent user

3. **Scroll to "Commissions" Inline Section**

   - You'll see existing commissions for this agent

4. **Add New Commission**

   - Click **"Add another Commission"** at the bottom
   - Fill in the fields inline:
     - Policy
     - Premium Amount
     - Commission Rate
   - Commission amount auto-calculates

5. **Save User**
   - Click "Save" at the bottom of the user form
   - Commission is saved with the user

---

## 🔧 Admin Actions for Commission Management

Once commissions are created, admins can manage them with bulk actions:

### Available Actions:

1. **Mark as Paid**

   - Select commissions
   - Choose "Mark as Paid" from Actions dropdown
   - Click "Go"
   - Auto-sets payment date to today
   - Status changes to PAID

2. **Mark as Approved**

   - Changes status to APPROVED
   - Ready for payment processing

3. **Mark as Pending**
   - Resets status to PENDING
   - Use if approval was incorrect

### Using Actions:

1. Go to **User Management → Agent Commissions**
2. Filter or search for commissions
3. Select one or more commissions (checkboxes)
4. Choose action from dropdown
5. Click "Go"
6. Confirm the action

---

## 📊 Commission Calculation

### Auto-Calculation Formula:

```python
commission_amount = (premium_amount × commission_rate) / 100
```

### Examples:

| Premium Amount | Commission Rate | Commission Amount |
| -------------- | --------------- | ----------------- |
| KSh 10,000     | 15%             | KSh 1,500         |
| KSh 25,000     | 12%             | KSh 3,000         |
| KSh 50,000     | 10%             | KSh 5,000         |
| KSh 100,000    | 15%             | KSh 15,000        |

### Commission Rate Guidelines:

- **Standard Products**: 15% (default)
- **Premium Products**: 12%
- **Fleet/Corporate**: 10%
- **Special Rates**: Variable (set per agent)

---

## 🔍 Finding Paid Policies

To create commissions, you need to identify paid policies:

### Criteria for Paid Policies:

1. **Policy Status = ACTIVE**

   - Only ACTIVE policies are considered paid
   - Draft, pending, cancelled policies don't get commissions

2. **Has Policy Number**

   - Generated after payment confirmation

3. **Has Premium Breakdown**
   - JSON field with premium details

### Filter Paid Policies:

1. Go to **Motor Insurance → Motor Policies**
2. Use sidebar filters:
   - **Status**: Select "ACTIVE"
   - **Date Created**: Select date range
   - **Agent**: Filter by specific agent
3. Review the list of eligible policies

---

## ✅ Best Practices

### Do's:

- ✅ Always verify policy is ACTIVE before creating commission
- ✅ Use exact premium amount from policy
- ✅ Set appropriate commission rate based on product
- ✅ Add payment reference when marking as PAID
- ✅ Use bulk actions for multiple commissions
- ✅ Review commission summary in agent profile

### Don'ts:

- ❌ Don't create commissions for DRAFT or PENDING policies
- ❌ Don't manually calculate commission amount (it's auto-calculated)
- ❌ Don't create duplicate commissions for same policy
- ❌ Don't forget to update payment status after payment
- ❌ Don't skip payment reference for paid commissions

---

## 🚨 Common Issues and Solutions

### Issue 1: Commission Amount Not Calculating

**Solution**:

- Ensure both premium_amount and commission_rate are filled
- Save the record - calculation happens on save()
- If still not calculating, contact developer

### Issue 2: Can't Find Agent in Dropdown

**Solution**:

- Verify user has agent role
- Check user has staff_user_profile with agent_code
- User must be active (is_active=True)

### Issue 3: Policy Not Showing in Dropdown

**Solution**:

- Verify policy status is ACTIVE
- Check policy has policy_number
- Ensure policy wasn't deleted

### Issue 4: Duplicate Commission Error

**Solution**:

- Check if commission already exists for this policy
- Go to Agent Commissions list
- Filter by policy number
- Edit existing commission instead

---

## 📈 Tracking Commission Payments

### Payment Workflow:

```
1. PENDING → Commission created, awaiting approval
2. APPROVED → Admin approved for payment
3. PAID → Payment made to agent
4. DISPUTED → Issue with commission (rare)
```

### Payment Process:

1. **Review Pending Commissions**

   - Filter by Status: PENDING
   - Verify amounts and policies

2. **Approve for Payment**

   - Select commissions
   - Use "Mark as Approved" action

3. **Process Payments**

   - Make actual payments to agents (M-PESA, bank transfer)
   - Get payment references

4. **Update Payment Records**

   - Select paid commissions
   - Use "Mark as Paid" action
   - Manually add payment references in detail view

5. **Agent Verification**
   - Agents can view their commissions in their profile
   - Payment date and reference visible

---

## 📱 View Commission Summary

### For Individual Agent:

1. Go to **User Management → Users**
2. Click on agent's name
3. View sections:

   - **Commission Summary** (top of page)

     - Total Earned
     - Total Pending
     - Total Paid
     - Number of Transactions

   - **Commissions Inline** (bottom of page)
     - All commission records
     - Status and amounts

### For All Commissions:

1. Go to **User Management → Agent Commissions**
2. Use filters:
   - Payment Status
   - Payment Date
   - Commission Rate
3. Search by:
   - Agent email
   - Agent code
   - Payment reference

---

## 🎯 Quick Reference

### Add Commission Manually:

```
Admin → User Management → Agent Commissions → Add Agent Commission
Fill: Agent, Policy, Premium Amount, Commission Rate
Save
```

### Generate from Policies:

```
Admin → Motor Insurance → Motor Policies
Filter: Status = ACTIVE
Select policies → Actions: Generate Commissions → Go
```

### Mark as Paid:

```
Admin → User Management → Agent Commissions
Select commissions → Actions: Mark as Paid → Go
```

### View Agent Commissions:

```
Admin → User Management → Users → Click Agent Name
See: Commission Summary + Commissions Inline
```

---

## 📞 Need Help?

If you encounter issues:

1. Check this guide first
2. Verify policy is ACTIVE
3. Ensure agent has proper profile
4. Check for duplicate commissions
5. Contact system administrator

---

**Last Updated**: October 10, 2025  
**For**: PataBima Insurance App  
**Admin Version**: Django Admin with Enhanced User Management
