# How to Apply 0.3% Commission on All Agent Sales Monthly

## Question

**"How do I apply 0.3% commission on all agents' sales on a monthly basis?"**

---

## Solution Options

### Option 1: Change Default Commission Rate (Simplest)

If you want **all commissions** to be 0.3% instead of 15%, simply change the default rate in the auto-generate action.

**File**: `insurance-app/app/admin.py`  
**Location**: `MotorPolicyAdmin.generate_commissions_for_policies()` method

**Change this line**:

```python
commission_rate=Decimal('15.00'),  # Default 15%
```

**To**:

```python
commission_rate=Decimal('0.30'),  # 0.3%
```

**Result**: All auto-generated commissions will be 0.3%

---

### Option 2: Add Multiple Commission Rates (Recommended)

Create **two types of commissions** for each sale:

1. **Primary Commission**: 15% (standard agent commission)
2. **Monthly Bonus**: 0.3% (additional monthly incentive)

**Implementation**:

#### Step 1: Update AgentCommission Model

Add a commission type field:

```python
# In models.py - AgentCommission model

COMMISSION_TYPE_CHOICES = [
    ('STANDARD', 'Standard Commission'),  # 15%
    ('BONUS', 'Monthly Bonus'),           # 0.3%
    ('OVERRIDE', 'Manager Override'),     # Custom
]

commission_type = models.CharField(
    max_length=20,
    choices=COMMISSION_TYPE_CHOICES,
    default='STANDARD'
)
```

#### Step 2: Create Migration

```powershell
python manage.py makemigrations
python manage.py migrate
```

#### Step 3: Update Generate Commissions Action

Modify the action to create **both** commission types:

```python
# Create standard commission (15%)
standard_commission = AgentCommission.objects.create(
    agent=agent,
    policy=policy,
    premium_amount=premium_amount,
    commission_rate=Decimal('15.00'),
    commission_type='STANDARD',
    payment_status='PENDING',
    notes=f'Standard commission from policy {policy.policy_number}'
)

# Create monthly bonus (0.3%)
bonus_commission = AgentCommission.objects.create(
    agent=agent,
    policy=policy,
    premium_amount=premium_amount,
    commission_rate=Decimal('0.30'),
    commission_type='BONUS',
    payment_status='PENDING',
    notes=f'Monthly bonus from policy {policy.policy_number}'
)
```

---

### Option 3: Create Monthly Bonus System (Advanced)

Create a **separate monthly bonus** based on total sales.

#### Create New Model: MonthlyAgentBonus

```python
# In models.py

class MonthlyAgentBonus(BaseModel):
    """Track monthly bonuses for agents based on total sales."""

    agent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='monthly_bonuses')

    # Period
    month = models.IntegerField(help_text="Month (1-12)")
    year = models.IntegerField(help_text="Year (e.g., 2025)")
    period = models.CharField(max_length=20, help_text="e.g., '2025-10'", db_index=True)

    # Sales Summary
    total_policies = models.IntegerField(default=0)
    total_premium = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Bonus Calculation
    bonus_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.30'),
        help_text="Bonus percentage (e.g., 0.30 for 0.3%)"
    )
    bonus_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Calculated bonus amount"
    )

    # Payment Tracking
    PAYMENT_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('PAID', 'Paid'),
    ]
    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default='PENDING'
    )
    payment_date = models.DateField(null=True, blank=True)
    payment_reference = models.CharField(max_length=100, blank=True)

    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-year', '-month']
        unique_together = ['agent', 'period']
        verbose_name = 'Monthly Agent Bonus'
        verbose_name_plural = 'Monthly Agent Bonuses'

    def save(self, *args, **kwargs):
        # Auto-calculate bonus amount
        self.bonus_amount = (self.total_premium * self.bonus_rate) / Decimal('100')
        # Auto-set period
        self.period = f"{self.year}-{self.month:02d}"
        super().save(*args, **kwargs)

    def __str__(self):
        agent_name = self.agent.email or self.agent.phonenumber
        return f"{agent_name} - {self.period} - KSh {self.bonus_amount}"
```

#### Create Admin for Monthly Bonus

```python
# In admin.py

@admin.register(MonthlyAgentBonus)
class MonthlyAgentBonusAdmin(admin.ModelAdmin):
    list_display = (
        'agent_display',
        'period',
        'total_policies',
        'total_premium_display',
        'bonus_rate',
        'bonus_amount_display',
        'payment_status'
    )

    list_filter = ('payment_status', 'year', 'month')

    search_fields = (
        'agent__email',
        'agent__phonenumber',
        'agent__staff_user_profile__agent_code',
        'period'
    )

    readonly_fields = ('bonus_amount', 'period', 'date_created')

    actions = ['calculate_monthly_bonuses', 'mark_as_paid']

    def agent_display(self, obj):
        if hasattr(obj.agent, 'staff_user_profile') and obj.agent.staff_user_profile:
            return f"{obj.agent.staff_user_profile.full_names} ({obj.agent.staff_user_profile.agent_code})"
        return obj.agent.email or obj.agent.phonenumber
    agent_display.short_description = 'Agent'

    def total_premium_display(self, obj):
        return f"KSh {obj.total_premium:,.2f}"
    total_premium_display.short_description = 'Total Premium'

    def bonus_amount_display(self, obj):
        return f"KSh {obj.bonus_amount:,.2f}"
    bonus_amount_display.short_description = 'Bonus Amount'

    def calculate_monthly_bonuses(self, request, queryset):
        """Recalculate bonuses from actual sales data."""
        import json
        from datetime import datetime

        updated = 0
        for bonus in queryset:
            # Get all ACTIVE policies for this agent in this period
            start_date = datetime(bonus.year, bonus.month, 1).date()
            if bonus.month == 12:
                end_date = datetime(bonus.year + 1, 1, 1).date()
            else:
                end_date = datetime(bonus.year, bonus.month + 1, 1).date()

            policies = MotorPolicy.objects.filter(
                user=bonus.agent,
                status='ACTIVE',
                cover_start_date__gte=start_date,
                cover_start_date__lt=end_date
            )

            total_premium = Decimal('0.00')
            for policy in policies:
                if policy.premium_breakdown:
                    try:
                        breakdown = json.loads(policy.premium_breakdown) if isinstance(policy.premium_breakdown, str) else policy.premium_breakdown
                        total_premium += Decimal(str(breakdown.get('total_payable', 0)))
                    except:
                        continue

            bonus.total_policies = policies.count()
            bonus.total_premium = total_premium
            bonus.save()  # Auto-calculates bonus_amount
            updated += 1

        self.message_user(request, f"Recalculated {updated} monthly bonus(es).", level=messages.SUCCESS)
    calculate_monthly_bonuses.short_description = "Recalculate bonuses from sales"

    def mark_as_paid(self, request, queryset):
        updated = queryset.update(
            payment_status='PAID',
            payment_date=timezone.now().date()
        )
        self.message_user(request, f"{updated} bonuses marked as paid.", level=messages.SUCCESS)
    mark_as_paid.short_description = "Mark as Paid"
```

#### Create Management Command for Auto-Calculation

Create: `insurance-app/app/management/commands/calculate_monthly_bonuses.py`

```python
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from app.models import MotorPolicy, MonthlyAgentBonus
from decimal import Decimal
from datetime import datetime, timedelta
import json

User = get_user_model()

class Command(BaseCommand):
    help = 'Calculate monthly bonuses for all agents'

    def add_arguments(self, parser):
        parser.add_argument(
            '--month',
            type=int,
            help='Month (1-12). Defaults to last month.'
        )
        parser.add_argument(
            '--year',
            type=int,
            help='Year (e.g., 2025). Defaults to current year.'
        )

    def handle(self, *args, **options):
        # Get period
        if options['month'] and options['year']:
            month = options['month']
            year = options['year']
        else:
            # Default to last month
            last_month = datetime.now() - timedelta(days=30)
            month = last_month.month
            year = last_month.year

        period = f"{year}-{month:02d}"

        self.stdout.write(f"Calculating bonuses for {period}...")

        # Get all agents
        agents = User.objects.filter(
            staff_user_profile__isnull=False
        )

        created = 0
        updated = 0

        for agent in agents:
            # Calculate date range
            start_date = datetime(year, month, 1).date()
            if month == 12:
                end_date = datetime(year + 1, 1, 1).date()
            else:
                end_date = datetime(year, month + 1, 1).date()

            # Get ACTIVE policies in this period
            policies = MotorPolicy.objects.filter(
                user=agent,
                status='ACTIVE',
                cover_start_date__gte=start_date,
                cover_start_date__lt=end_date
            )

            if not policies.exists():
                continue

            # Calculate total premium
            total_premium = Decimal('0.00')
            for policy in policies:
                if policy.premium_breakdown:
                    try:
                        breakdown = json.loads(policy.premium_breakdown) if isinstance(policy.premium_breakdown, str) else policy.premium_breakdown
                        total_premium += Decimal(str(breakdown.get('total_payable', 0)))
                    except:
                        continue

            # Create or update bonus record
            bonus, is_created = MonthlyAgentBonus.objects.update_or_create(
                agent=agent,
                period=period,
                defaults={
                    'month': month,
                    'year': year,
                    'total_policies': policies.count(),
                    'total_premium': total_premium,
                    'bonus_rate': Decimal('0.30'),  # 0.3%
                    'payment_status': 'PENDING'
                }
            )

            if is_created:
                created += 1
            else:
                updated += 1

            agent_name = agent.staff_user_profile.full_names if hasattr(agent, 'staff_user_profile') else agent.email
            self.stdout.write(
                f"  {agent_name}: {policies.count()} policies, "
                f"KSh {total_premium:,.2f} premium, "
                f"KSh {bonus.bonus_amount:,.2f} bonus"
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"\nCompleted! Created {created}, Updated {updated} bonus records."
            )
        )
```

#### Run Monthly Bonus Calculation

```powershell
# For last month
python manage.py calculate_monthly_bonuses

# For specific month
python manage.py calculate_monthly_bonuses --month 10 --year 2025
```

---

## Recommended Approach

### For Your Use Case (0.3% on all sales monthly):

**I recommend Option 3** - Create a separate Monthly Bonus system because:

✅ **Keeps standard commissions separate** (15%)  
✅ **Tracks monthly bonuses separately** (0.3%)  
✅ **Easy to calculate** end of month  
✅ **Clear reporting** for agents  
✅ **Flexible** - can change bonus rate per month  
✅ **Automated** with management command

---

## Implementation Steps

### Quick Implementation (15 minutes):

1. **Add MonthlyAgentBonus model** to `models.py`
2. **Create migration**: `python manage.py makemigrations`
3. **Apply migration**: `python manage.py migrate`
4. **Add admin** for MonthlyAgentBonus
5. **Create management command** for auto-calculation
6. **Test** with current month

### Usage:

**End of Each Month**:

```powershell
# Calculate bonuses for all agents
python manage.py calculate_monthly_bonuses

# Or via admin:
# Go to Monthly Agent Bonuses → Select all → Action: "Recalculate bonuses from sales"
```

**Review and Approve**:

1. Go to Admin → User Management → Monthly Agent Bonuses
2. Filter by month
3. Review calculations
4. Select bonuses → Mark as Approved
5. Process payments
6. Select paid bonuses → Mark as Paid

---

## Example Calculation

**Agent: John Doe**  
**Month**: October 2025  
**Sales**:

- Policy 1: KSh 20,000
- Policy 2: KSh 35,000
- Policy 3: KSh 15,000

**Total Premium**: KSh 70,000  
**Bonus Rate**: 0.3%  
**Bonus Amount**: KSh 70,000 × 0.003 = **KSh 210**

---

## Comparison of Options

| Feature                | Option 1   | Option 2 | Option 3   |
| ---------------------- | ---------- | -------- | ---------- |
| **Simplicity**         | ⭐⭐⭐⭐⭐ | ⭐⭐⭐   | ⭐⭐       |
| **Flexibility**        | ⭐         | ⭐⭐⭐   | ⭐⭐⭐⭐⭐ |
| **Separate Tracking**  | ❌         | ✅       | ✅         |
| **Monthly Automation** | ❌         | ⭐⭐     | ⭐⭐⭐⭐⭐ |
| **Clear Reporting**    | ⭐         | ⭐⭐⭐   | ⭐⭐⭐⭐⭐ |
| **Recommended**        | No         | Maybe    | **Yes**    |

---

## Need Help Implementing?

Let me know which option you prefer, and I'll implement it for you step-by-step!

**Quick Questions**:

1. Do you want 0.3% **instead of** 15%, or **in addition to** 15%?
2. Should it be calculated **per sale** or **monthly total**?
3. Do you want it automated end-of-month?

---

**Last Updated**: October 10, 2025  
**Status**: Ready to Implement
