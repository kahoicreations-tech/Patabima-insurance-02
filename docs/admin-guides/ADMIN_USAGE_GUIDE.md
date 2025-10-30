# PataBima Admin Portal - Simple User Guide

**Last Updated**: October 22, 2025  
**Website**: `http://your-website.com/admin/`

---

## 📋 Quick Guide: What You Can Do

This guide helps you manage your insurance app without technical jargon. Follow these simple steps to:
- Manage users and agents
- Set up insurance products and prices
- Track sales and commissions
- Handle customer quotes

---

## 🚀 Getting Started

### How to Log In

1. Open your web browser (Chrome, Firefox, Safari, etc.)
2. Go to: `http://ec2-34-203-241-81.compute-1.amazonaws.com/admin/`
3. Enter your username and password
4. Click "Log in"

**First Time?** Ask your IT person to create an admin account for you.

### Understanding Your Access Level

- **Super Administrator**: You can do everything
- **Administrator**: You can manage daily operations
- **Staff Member**: You can view reports and help customers

---

## 👥 Managing Users (Agents & Customers)

### How to See All Users

1. Click on **"Users"** from the main menu
2. You'll see a list showing:
   - **Name and Contact**: Email or phone number
   - **Type**: Agent, Customer, or Administrator
   - **Agent Code**: Special code for sales agents
   - **Number of Quotes**: How many insurance quotes they made
   - **Commission Earned**: Money earned by agents
   - **Status**: Active ✅ or Inactive ❌
   - **Join Date**: When they registered

### How to Find Specific Users

Use the filter buttons to search:
- **By Role**: Show only agents, customers, or admins
- **By Status**: Show only active or inactive users
- **By Date**: Show users who joined in a specific time period

1. Click "Users" in the menu
2. Use the filter buttons at the top
3. Click "Search" to find a specific person

### Adding a New User

**Step-by-Step**:

1. Click the **"Add User +"** button
2. Fill in the information:
   - **Phone Number**: Enter in format +254712345678
   - **Email**: Customer's email address
   - **Password**: Create a secure password (enter it twice)
   - **Role**: Choose Agent, Customer, or Admin
   - **Active**: Keep this checked so they can log in
3. Click **"Save"**

💡 **Tip**: The system keeps passwords secure automatically.

### Making Someone an Agent

**Turn customers into sales agents**:

1. Select the users you want (tick the checkboxes)
2. At the top, choose **"Convert to Agents"**
3. Click **"Go"**

✨ **What happens**: 
- They get an agent code (like AGT-1001)
- They become staff members
- They can now sell insurance and earn commissions

### Viewing Someone's Full Profile

**See everything about a user**:

1. Click on their name in the list
2. Click **"View Full Profile"** button
3. You'll see:
   - 📊 How many quotes they made
   - 💰 How much commission they earned
   - 📝 Their recent quotes and policies
   - 🎁 Any bonuses they received

### Quick Actions for Multiple Users

**Select users (tick checkboxes) and choose**:

- ✅ **Activate Users**: Let them log in again
- ❌ **Deactivate Users**: Stop them from logging in
- 📑 **Export Report**: Download their information to Excel
- 👔 **Make Agents**: Turn them into sales agents

---

## Motor Insurance Management

### Motor Policies

**Location**: `Admin Home → Motor Policies`

**List View**:
- Policy number
- Agent name and code
- Status (DRAFT, ACTIVE, EXPIRED, EXTENDED, CANCELLED)
- Cover dates (start and end)
- Submission date
- Commission status
- Quick action buttons

**Filtering**:
- Status (Active, Draft, Expired, etc.)
- Cover start date
- Has commission (Yes/No)

### Creating Commissions for Policies

**Method 1: Single Policy**
1. Find policy in list
2. Click **"Create commission"** button (if eligible)
3. Commission is auto-generated based on policy premium

**Method 2: Bulk Selection**
1. Select multiple ACTIVE policies (checkboxes)
2. Choose action: **"Generate commissions for selected policies"**
3. Click **"Go"**

**Method 3: All Active Policies**
1. Click **"Generate commissions / all active policies"** link at top
2. Review confirmation page
3. Click **"Confirm"**
4. System creates commissions for ALL active policies without existing commissions

### Motor Insurance Details

**Where to find it**: Click "Motor Insurance Details" in the menu

**What you'll see**:
- Car make, model, and year
- Registration number
- Owner's name
- Insurance start and end dates
- Related quote

---

## 📝 Handling Manual Quotes (Medical, Travel, etc.)

### What Are Manual Quotes?

These are insurance requests that need YOU to calculate the price:

- 🏥 Medical Insurance
- ✈️ Travel Insurance  
- 🔨 WIBA (Workers' Injury Insurance)
- ⚰️ Last Expense Insurance
- 🏠 Domestic Package Insurance
- 🚑 Personal Accident Insurance

**Where to find them**: Click "Manual Quotes" in the menu

### Quote Status Explained

Quotes move through these stages:

1. **Waiting for Review** → Agent just sent it
2. **Being Processed** → You're working on it
3. **Done** → Price calculated and sent back
4. **Rejected** → Can't be processed

### What You'll See

**Top of page shows**:
- 📋 How many medical quotes waiting
- ⏳ How many you're working on
- ✅ How many you finished today
- 📊 Total quotes waiting

**Each quote shows**:
- Reference number (like MQ-2025-001234)
- Type of insurance
- Agent's name
- Current status
- Date it was created
- How many days it's been waiting

### How to Process a Quote

**Step 1: Look at the Details**
1. Click on the quote
2. Check the customer's information
3. See which insurance companies the agent prefers

**Step 2: Calculate the Price**
1. Find the "Admin Pricing" section
2. Enter the **Total Premium** (the final price)
3. Add the breakdown like this:
   - Base price: 25,000
   - ITL (0.25%): 62.50
   - PCF (0.25%): 62.50
   - Stamp duty: 40
   - **Total: 25,165**
4. Add any notes (optional)

**Step 3: Finish It**
1. Change status to **"Completed"**
2. Click **"Save"**

✅ The agent will now see the price in their app!

### Working with Multiple Quotes at Once

**You can select many quotes and**:
- Start working on them (change to "In Progress")
- Complete them all at once
- Reject ones you can't process

**How**: Tick the checkboxes → Choose action → Click "Go"

### Finding Specific Quotes

**Filter by**:
- Insurance type (Medical, Travel, etc.)
- Status (Waiting, Processing, Done)
- Date created

**Search for**: Reference number, agent name, or phone

### 💡 Important Tips

- ⏰ **Try to finish quotes within 24 hours** - agents are waiting!
- 💰 **Standard charges to add**:
  - ITL: 0.25% of base price
  - PCF: 0.25% of base price
  - Stamp duty: Always KSh 40
- 📝 **Write notes** if the quote is complicated
- ❌ **If you reject a quote**, call the agent to explain why

---

## 💰 Managing Agent Commissions

### Setting the Default Commission Rate

**Where to go**: Click "Commission Settings" in menu

**What it does**: Sets the percentage agents earn on sales

**How to change it**:
1. Click "Edit"
2. Change the number (default is 15%)
3. Click **"Apply to ALL commissions"** button
4. All agent earnings update automatically

### Creating Special Commission Rules

**Where to go**: Click "Commission Rules" in menu

**Why**: Give different rates for different products or insurance companies

**Examples**:
- Private Comprehensive cars: 12%
- Madison Insurance: 14%
- Medical insurance: 10%

**How to create a rule**:
1. Click **"Add Commission Rule"**
2. Fill in:
   - Name (e.g., "Madison Comprehensive - Special Rate")
   - Rate (percentage, e.g., 12.50)
   - Priority (e.g., 10)
   - Active status
   - Subcategory (optional)
   - Underwriter (optional)
   - Line key (optional)
   - Effective dates (optional)
1. Click "Add Rule"
2. Fill in:
   - Product type or insurance company
   - Commission percentage
   - Priority (higher number = more important)
3. Click "Save"

💡 **How it works**: The most specific rule always wins!

### Viewing Agent Commissions

**Where to go**: Click "Agent Commissions" in menu

**What you'll see**:
- Agent name and code
- Policy number
- Insurance amount
- Commission percentage
- Amount they earned
- Payment status (Waiting/Approved/Paid)
- Payment date

### Paying Commissions

**For one agent**:
1. Click on the commission
2. Change status to "Paid"
3. Enter today's date
4. Add transaction reference (optional)
5. Click "Save"

**For many agents at once**:
1. Select commissions (tick checkboxes)
2. Choose action:
   - **"Mark as Paid"** - They've been paid
   - **"Mark as Approved"** - Ready to pay
   - **"Mark as Pending"** - Still waiting
3. Click "Go"

### How Commission Is Calculated

**Simple formula**:
- Insurance price × Commission rate = Amount earned

**Example**:
- Insurance costs KSh 25,000
- Commission rate is 15%
- Agent earns: KSh 3,750

✨ The system calculates this automatically!

### Finding Specific Commissions

**Filter by**: Status, date paid, date created
**Search for**: Agent name, phone, code, or payment reference

---

## 📊 Tracking Agent Performance

### Setting Sales Targets

**Where to go**: Click "Agent Performance" in menu

**What you'll see**:
- Agent name
- Month (like "October 2025")
- Target they need to reach
- What they've actually achieved
- Percentage complete

### Creating a New Target

**Steps**:
1. Click **"Add Agent Performance"**
2. Fill in:
   - Choose the agent
   - Select the month/period
   - Enter start and end dates
   - Set target: Number of policies to sell
   - Set target: Total amount of insurance (KSh)
3. Click **"Save"**

✨ **The system tracks progress automatically!**

### Updating Progress

**To refresh all targets**:
1. Select performance records (tick boxes)
2. Choose **"Update from Sales"**
3. Click **"Go"**

📈 This counts all completed sales and updates percentages.

### Monthly Bonuses for Agents

**Where to go**: Click "Monthly Agent Bonuses" in menu

**How bonuses work**:
- Agents get 0.3% of their total monthly sales
- Only paid policies count
- Paid at the end of each month

**What you'll see**:
- Agent name and code
- Month (like "October 2025")
- How many policies they sold
- Total amount sold
- Bonus percentage (0.30%)
- Amount they'll get
- Payment status

### Creating a Bonus

**Steps**:
1. Click **"Add Bonus"**
2. Select agent, year, and month
3. Click **"Save"**
4. Select the bonus record
5. Choose **"Calculate from Sales"**
6. Click **"Go"**

✅ System calculates the exact bonus amount!

**Method 2: Generate for All Agents (Bulk)**
1. Create one bonus record for the target period
2. Select it
3. Choose action: **"Generate Bonuses for All Agents (Selected Periods)"**
4. Click **"Go"**
5. System creates bonuses for all agents with sales in that period

**Bonus Calculation**:
```
Bonus Amount = (Total Premium × 0.3) ÷ 100
```

**Example**:
- Agent A sold 15 policies in October
- Total premium: KSh 375,000
- Bonus: KSh 1,125 (375,000 × 0.3%)

### Bonus Payment Workflow

**Status Flow**:
```
PENDING → APPROVED → PAID
```

**Processing Bonuses**:
1. Generate bonuses at month-end
2. Review calculations
3. Select bonuses → **"Mark as Approved"**
4. Process payments
5. Select bonuses → **"Mark as Paid"**
6. Enter payment reference and date

---

## 🏢 Managing Insurance Companies (Underwriters)

### What Are Underwriters?

These are the insurance companies that provide the actual coverage:
- Madison Insurance
- Britam
- APA Insurance
- etc.

**Where to go**: Click "Insurance Providers" in menu

**Display Options**:
- **Standard**: Show the exact price
- **Hidden**: Don't show price to agents (yet)
- **Range**: Show price range (minimum to maximum)

### Adding a New Insurance Company

**Steps**:
1. Click **"Add Insurance Provider"**
2. Enter details:
   - Company name (like "Madison Insurance")
   - Short code (like "MADISON")
   - What they insure (Cars, Medical, etc.)
   - How customers can pay (M-PESA, Bank, etc.)
3. Contact information:
   - Email address
   - Phone number
   - Physical address
4. Choose display mode
5. Click **"Save"**

### Setting Up Prices (Advanced)

**Note**: Skip this section if you're not comfortable with technical stuff!

You can set prices for each insurance company in the "Features" field. Ask your IT person to help with this part.

**After adding prices**:
1. Save the insurance company
2. Select it (tick the checkbox)
3. Choose **"Create Prices from Settings"**
4. Click **"Go"**

✨ The system creates all the price records automatically!

### Managing Car Insurance Prices

**Where to go**: Click "Motor Pricing" in menu

**What you can change**:
- Insurance company
- Car type (private, commercial, etc.)
- Base price
- Minimum price
- Maximum price
- When it starts
- Active or inactive

**Finding prices**: Use filters to find specific company or car type

### Car Categories & Types

**Main Categories** (Click "Motor Categories"):
- 🚗 Private (personal cars)
- 🚚 Commercial (trucks, vans)
- 🚌 PSV (matatus, buses)
- 🏍️ Motorcycle
- 🛺 TukTuk
- 🚜 Special (tractors, etc.)

**Specific Types** (Click "Motor Subcategories"):
Shows all the different insurance products we offer

**Adding a new type**:
1. Click **"Add Motor Subcategory"**
2. Enter:
   - Short code (like "PRIVATE_COMPREHENSIVE")
   - Name people see (like "Private Comprehensive")
   - Main category (pick from list)
   - Insurance type (Third-Party/Comprehensive/TOR)
   - How to calculate price
   - Active or inactive
3. Click **"Save"**

### Truck/Lorry Pricing by Weight

**Where to go**: Click "Commercial Tonnage Pricing"

**For trucks that price by weight**:
- Up to 3 Tons
- 3-6 Tons
- 6-10 Tons
- 10-15 Tons
- 15-20 Tons
- Over 20 Tons
1. Click **"Add Commercial Tonnage Pricing"**
2. Select subcategory and underwriter
3. Enter tonnage description and base premium
4. Set active status
5. Click **"Save"**

### PSV PLL Pricing

**Location**: `Admin Home → PSV PLL Pricing`

For PSV (Public Service Vehicle) with Passenger Legal Liability:
- PLL amount (coverage amount)
- Rate per person
- Underwriter-specific rates

### Additional Field Pricing

**Location**: `Admin Home → Additional Field Pricing`

For dynamic form fields that affect pricing:
- Field code
- Field type
- Options (if dropdown/radio)
- Price impact rules

---

## Reports and Analytics

### Quick Stats Dashboard

Available on various admin pages:

**User Management**:
- Total users by role
- Active vs inactive agents
- New registrations this month

**Manual Quotes**:
- Pending medical quotes
- In-progress quotes
- Completed today
- Total pending across all types

**Commissions**:
- Total pending commission amount
- Approved commissions awaiting payment
- Paid this month
- Top earning agents

### Generating Reports

**Method 1: List View Filters**
1. Navigate to relevant section
2. Apply filters
3. Use browser's print function (Ctrl+P)
4. Save as PDF

**Method 2: Export Actions**
1. Select records (checkboxes)
2. Choose action: **"Export user report"** (or similar)
3. Click **"Go"**
4. Download CSV/Excel file

### Common Reports

**Agent Performance Report**:
1. Go to Agent Performance
2. Filter by period
3. Sort by achievement percentage
4. Export or print

**Commission Payment Report**:
1. Go to Agent Commissions
2. Filter by payment status: PAID
3. Filter by payment date range
4. Export list

**Monthly Bonus Report**:
1. Go to Monthly Agent Bonuses
2. Filter by year and month
3. Review total payouts
4. Export for accounting

**Policy Sales Report**:
1. Go to Motor Policies
2. Filter by cover start date
3. Filter by status: ACTIVE
4. Count and premium totals shown in filters

---

## Advanced Features

### Bulk Operations

**Supported Bulk Actions**:
- Generate commissions for multiple policies
- Mark multiple commissions as paid
- Update multiple performance records
- Generate bonuses for all agents
- Activate/deactivate multiple users
- Apply global commission rate

**Best Practices**:
1. Always preview selections before bulk actions
2. Use filters to narrow down records first
3. Test with small batch before full bulk operation
4. Review results after bulk action completes

### Search Functionality

**Global Search Tips**:
- Use partial matches (e.g., "0712" finds "+254712345678")
- Search works across multiple fields simultaneously
- Case-insensitive search
- Use agent codes for quick agent lookup

**Advanced Searches**:
- Combine filters with search
- Use date ranges with search terms
- Search in related fields (e.g., agent name from policy)

### Custom Filters

Available custom filters:
- **Has Commission**: Show policies with/without commissions
- **User Role**: Filter users by role type
- **Line Key**: Filter manual quotes by insurance type
- **Payment Status**: Filter by commission payment status

---

## Troubleshooting

### Common Issues

**Issue**: "Commission already exists"
- **Solution**: Check if policy already has commission record
- Go to policy detail → View related commissions
- Use "Has commission: No" filter

**Issue**: "Could not create commission (missing agent)"
- **Solution**: Ensure policy is linked to agent user
- Edit policy → Assign to agent
- Save and retry commission generation

**Issue**: "Pricing not showing for underwriter"
- **Solution**: Check MotorPricing records
- Ensure pricing is active
- Verify effective_from date is in past
- Materialize pricing if using Pricing Builder

**Issue**: "Manual quote not visible to agent"
- **Solution**: Check quote status
- Only COMPLETED quotes show in agent app
- Review computed_premium is set
- Ensure levies_breakdown is valid JSON

### Getting Help

**For Technical Issues**:
- Check Django admin logs
- Review error messages carefully
- Contact system administrator

**For Business Logic Questions**:
- Refer to product documentation
- Contact insurance operations team
- Review underwriter agreements

---

## Security Best Practices

### Password Management

1. **Never share admin passwords**
2. **Change default passwords immediately**
3. **Use strong passwords** (12+ characters, mixed case, numbers, symbols)
4. **Enable two-factor authentication** (if available)
5. **Log out when leaving workstation**

### Data Protection

1. **Only access data you need** for your role
2. **Don't export sensitive data** unnecessarily
3. **Secure exported files** with passwords
4. **Delete exported files** after use
5. **Report suspicious activity** immediately

### Audit Trail

System automatically logs:
- Who created/modified records
- When changes were made
- What changed (in some models)

Review audit logs regularly for compliance.

---

## Quick Reference

### Important URLs

- **Admin Home**: `/admin/`
- **Users**: `/admin/app/user/`
- **Manual Quotes**: `/admin/app/manualquote/`
- **Motor Policies**: `/admin/app/motorpolicy/`
- **Commissions**: `/admin/app/agentcommission/`
- **Commission Settings**: `/admin/app/commissionsettings/`
- **Agent Performance**: `/admin/app/agentperformance/`
- **Monthly Bonuses**: `/admin/app/monthlyagentbonus/`
- **Insurance Providers**: `/admin/app/insuranceprovider/`

### Keyboard Shortcuts

- **Ctrl+S**: Save current record (when editing)
- **Ctrl+F**: Search within page
- **Ctrl+A**: Select all checkboxes (in list view)
- **Esc**: Cancel current action

### Status Codes Reference

**Manual Quote Status**:
- `PENDING_ADMIN_REVIEW`: Newly submitted
- `IN_PROGRESS`: Being processed
- `COMPLETED`: Pricing complete, sent to agent
- `REJECTED`: Cannot be processed

**Policy Status**:
- `DRAFT`: Quote stage
- `ACTIVE`: Paid policy with active coverage
- `EXPIRED`: Coverage ended
- `EXTENDED`: Policy extended after expiry
- `CANCELLED`: Policy cancelled

**Payment Status**:
- `PENDING`: Awaiting approval/payment
- `APPROVED`: Approved for payment
- `PAID`: Payment completed

---

## Changelog

**Version 1.0** (October 2025):
- Initial comprehensive admin guide
- Covers all major features
- Includes commission management
- Agent performance tracking
- Manual quotes workflow

---

## Support

**Admin Support**: Contact system administrator  
**Business Questions**: Contact operations team  
**Technical Issues**: Report to development team

**Emergency Contact**: [Your emergency contact details]

---

*This guide is maintained by the PataBima development team. Last updated: October 22, 2025*
