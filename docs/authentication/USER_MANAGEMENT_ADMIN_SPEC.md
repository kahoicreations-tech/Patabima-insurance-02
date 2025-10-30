# PataBima User Management Admin - Comprehensive Specification

## Document Overview

This specification outlines the implementation of a comprehensive user management system in the Django admin panel for the PataBima insurance application. The system will enable administrators to manage users based on their roles (Agents, Customers, Admins) and access all user-related data including quotations, commissions, policies, and performance metrics.

---

## 1. Current State Analysis

### Existing Models

- **User Model**: Custom user model with UUID primary key
- **StaffUserProfile**: Contains `agent_code` and `full_names` for agents
- **InsuranceQuotation**: Motor insurance quotes with `agent` foreign key
- **ManualQuote**: Non-motor insurance quotes with `agent` foreign key
- **MotorPolicy**: Motor policies with potential user references

### Current Admin Registration

- Basic User admin exists
- No role-based filtering
- No inline views for user's quotations/commissions
- No commission tracking interface

---

## 2. User Role Categories

### 2.1 Agent Users

**Characteristics:**

- `is_staff = False` (not admin staff)
- Has `StaffUserProfile` with `agent_code`
- Creates quotations for customers
- Earns commissions on sales
- Uses the mobile app to generate quotes

**Identification Logic:**

```python
def is_agent(user):
    return hasattr(user, 'staff_user_profile') and user.staff_user_profile is not None
```

### 2.2 Customer Users

**Characteristics:**

- `is_staff = False`
- No `StaffUserProfile` (no agent_code)
- Receives quotations and policies
- May use the app to view their policies

**Identification Logic:**

```python
def is_customer(user):
    return not user.is_staff and not hasattr(user, 'staff_user_profile')
```

### 2.3 Admin/Staff Users

**Characteristics:**

- `is_staff = True`
- Access to Django admin panel
- Manage the entire system
- May or may not have `agent_code`

**Identification Logic:**

```python
def is_admin_user(user):
    return user.is_staff or user.is_superuser
```

---

## 3. Database Schema Enhancements

### 3.1 Commission Tracking Model (NEW)

**Purpose:** Track agent commissions on each **paid policy** only

```python
class AgentCommission(models.Model):
    """Track commissions earned by agents on paid policies only."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    agent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='commissions')

    # Link to the paid policy (only paid policies are eligible)
    policy = models.ForeignKey('MotorPolicy', null=True, blank=True, on_delete=models.SET_NULL)
    # Optionally, link to non-motor paid policy if applicable
    # manual_policy = models.ForeignKey('ManualPolicy', null=True, blank=True, on_delete=models.SET_NULL)

    # Commission details
    premium_amount = models.DecimalField(max_digits=12, decimal_places=2, help_text="Total premium from the paid policy")
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, help_text="Commission percentage (e.g., 15.00 for 15%)")
    commission_amount = models.DecimalField(max_digits=12, decimal_places=2, help_text="Calculated commission amount")

    # Payment tracking
    payment_status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', 'Pending'),
            ('APPROVED', 'Approved'),
            ('PAID', 'Paid'),
            ('DISPUTED', 'Disputed'),
        ],
        default='PENDING'
    )
    payment_date = models.DateField(null=True, blank=True)
    payment_reference = models.CharField(max_length=100, blank=True)

    # Notes
    notes = models.TextField(blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Agent Commission'
        verbose_name_plural = 'Agent Commissions'

    def __str__(self):
        return f"{self.agent.email} - KSh {self.commission_amount} (Policy: {self.policy.policy_number if self.policy else '-'})"
```

### 3.2 Agent Performance Model (NEW)

**Purpose:** Track agent performance metrics and targets **based on paid policies only**

```python
class AgentPerformance(models.Model):
    """Track agent performance metrics and targets (paid policies only)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    agent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='performance_records')

    # Period tracking
    period = models.CharField(max_length=20, help_text="e.g., '2025-Q1', '2025-01', '2025'")
    period_start = models.DateField()
    period_end = models.DateField()

    # Targets
    target_policies = models.IntegerField(default=0, help_text="Target number of paid policies")
    target_premium = models.DecimalField(max_digits=12, decimal_places=2, help_text="Target total premium (paid policies)")

    # Achievements (count only paid policies)
    achieved_policies = models.IntegerField(default=0)
    achieved_premium = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Calculated fields
    achievement_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-period_start']
        unique_together = ('agent', 'period')
        verbose_name = 'Agent Performance'
        verbose_name_plural = 'Agent Performance Records'

    def __str__(self):
        return f"{self.agent.email} - {self.period}"

    def save(self, *args, **kwargs):
        # Calculate achievement percentage based on paid policies only
        if self.target_premium > 0:
            self.achievement_percentage = (self.achieved_premium / self.target_premium) * 100
        super().save(*args, **kwargs)
```

### 3.3 User Role Field Enhancement

**Add role field to User model or StaffUserProfile:**

```python
# In User model or create UserProfile model
user_role = models.CharField(
    max_length=20,
    choices=[
        ('AGENT', 'Sales Agent'),
        ('CUSTOMER', 'Customer'),
        ('ADMIN', 'Administrator'),
        ('MANAGER', 'Manager'),
    ],
    default='CUSTOMER'
)
```

---

## 4. Admin Interface Design

### 4.1 Enhanced UserAdmin

**File:** `insurance-app/app/admin.py`

```python
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.urls import reverse
from django.utils.html import format_html
from django.db.models import Sum, Count, Q
from django.utils import timezone

@admin.register(User)
class EnhancedUserAdmin(BaseUserAdmin):
    """Enhanced User admin with role-based management and comprehensive user data."""

    list_display = (
        'email_or_phone',
        'user_role_display',
        'agent_code_display',
        'total_quotes',
        'total_commission',
        'is_active',
        'date_joined'
    )

    list_filter = (
        'is_staff',
        'is_active',
        'is_superuser',
        'date_joined',
        RoleFilter,  # Custom filter
    )

    search_fields = (
        'email',
        'phonenumber',
        'staff_user_profile__agent_code',
        'staff_user_profile__full_names'
    )

    readonly_fields = (
        'date_joined',
        'last_login',
        'performance_summary',
        'commission_summary',
        'quote_summary'
    )

    fieldsets = (
        ('Basic Information', {
            'fields': ('email', 'phonenumber', 'password')
        }),
        ('Role & Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Agent Details', {
            'fields': ('agent_code_display', 'performance_summary'),
            'classes': ('collapse',),
        }),
        ('Activity Summary', {
            'fields': ('quote_summary', 'commission_summary', 'date_joined', 'last_login'),
        }),
    )

    inlines = [
        MotorQuotationInline,
        ManualQuoteInline,
        CommissionInline,
        PerformanceInline,
    ]

    actions = [
        'activate_users',
        'deactivate_users',
        'promote_to_agent',
        'export_agent_report',
        'calculate_commissions',
    ]

    # Custom methods
    def email_or_phone(self, obj):
        return obj.email or obj.phonenumber
    email_or_phone.short_description = 'Contact'

    def user_role_display(self, obj):
        if obj.is_superuser:
            return format_html('<span style="color: red;">●</span> Superuser')
        elif obj.is_staff:
            return format_html('<span style="color: blue;">●</span> Admin')
        elif hasattr(obj, 'staff_user_profile') and obj.staff_user_profile:
            return format_html('<span style="color: green;">●</span> Agent')
        else:
            return format_html('<span style="color: gray;">●</span> Customer')
    user_role_display.short_description = 'Role'

    def agent_code_display(self, obj):
        if hasattr(obj, 'staff_user_profile') and obj.staff_user_profile:
            return obj.staff_user_profile.agent_code
        return '-'
    agent_code_display.short_description = 'Agent Code'

    def total_quotes(self, obj):
        motor = InsuranceQuotation.objects.filter(agent=obj).count()
        manual = ManualQuote.objects.filter(agent=obj).count()
        total = motor + manual
        if total > 0:
            url = reverse('admin:app_insurancequotation_changelist') + f'?agent__id__exact={obj.pk}'
            return format_html('<a href="{}">{}</a>', url, total)
        return '0'
    total_quotes.short_description = 'Total Quotes'

    def total_commission(self, obj):
        from django.db.models import Sum
        total = AgentCommission.objects.filter(agent=obj).aggregate(
            total=Sum('commission_amount')
        )['total'] or 0
        if total > 0:
            url = reverse('admin:app_agentcommission_changelist') + f'?agent__id__exact={obj.pk}'
            return format_html('<a href="{}">KSh {:,.2f}</a>', url, total)
        return 'KSh 0.00'
    total_commission.short_description = 'Total Commission'

    def performance_summary(self, obj):
        """Display recent performance metrics."""
        if not hasattr(obj, 'staff_user_profile') or not obj.staff_user_profile:
            return '-'

        # Get current month performance
        today = timezone.now().date()
        current_month = AgentPerformance.objects.filter(
            agent=obj,
            period_start__lte=today,
            period_end__gte=today
        ).first()

        if not current_month:
            return 'No performance data'

        return format_html(
            '<strong>Current Period:</strong> {}<br>'
            '<strong>Target:</strong> KSh {:,.2f}<br>'
            '<strong>Achieved:</strong> KSh {:,.2f} ({:.1f}%)<br>'
            '<strong>Policies:</strong> {} / {}',
            current_month.period,
            current_month.target_premium,
            current_month.achieved_premium,
            current_month.achievement_percentage,
            current_month.achieved_policies,
            current_month.target_policies
        )
    performance_summary.short_description = 'Performance'

    def commission_summary(self, obj):
        """Display commission breakdown."""
        if not hasattr(obj, 'staff_user_profile') or not obj.staff_user_profile:
            return '-'

        stats = AgentCommission.objects.filter(agent=obj).aggregate(
            total=Sum('commission_amount'),
            pending=Sum('commission_amount', filter=Q(payment_status='PENDING')),
            paid=Sum('commission_amount', filter=Q(payment_status='PAID')),
            count=Count('id')
        )

        return format_html(
            '<strong>Total Earned:</strong> KSh {:,.2f}<br>'
            '<strong>Pending:</strong> KSh {:,.2f}<br>'
            '<strong>Paid:</strong> KSh {:,.2f}<br>'
            '<strong>Transactions:</strong> {}',
            stats['total'] or 0,
            stats['pending'] or 0,
            stats['paid'] or 0,
            stats['count'] or 0
        )
    commission_summary.short_description = 'Commission Summary'

    def quote_summary(self, obj):
        """Display quote statistics."""
        motor_count = InsuranceQuotation.objects.filter(agent=obj).count()
        manual_count = ManualQuote.objects.filter(agent=obj).count()

        motor_premium = InsuranceQuotation.objects.filter(agent=obj).aggregate(
            total=Sum('total_premium')
        )['total'] or 0

        manual_premium = ManualQuote.objects.filter(agent=obj).aggregate(
            total=Sum('computed_premium')
        )['total'] or 0

        return format_html(
            '<strong>Motor Quotes:</strong> {} (KSh {:,.2f})<br>'
            '<strong>Non-Motor Quotes:</strong> {} (KSh {:,.2f})<br>'
            '<strong>Total:</strong> {} quotes, KSh {:,.2f}',
            motor_count,
            motor_premium,
            manual_count,
            manual_premium,
            motor_count + manual_count,
            motor_premium + manual_premium
        )
    quote_summary.short_description = 'Quote Summary'

    # Actions
    def promote_to_agent(self, request, queryset):
        """Promote selected users to agent role."""
        # Implementation for creating StaffUserProfile
        pass
    promote_to_agent.short_description = "Promote to Agent"

    def calculate_commissions(self, request, queryset):
        """Calculate and create commission records for agents."""
        # Implementation for commission calculation
        pass
    calculate_commissions.short_description = "Calculate Commissions"
```

### 4.2 Custom Role Filter

```python
class RoleFilter(admin.SimpleListFilter):
    """Filter users by their role."""
    title = 'user role'
    parameter_name = 'role'

    def lookups(self, request, model_admin):
        return (
            ('agent', 'Agents'),
            ('customer', 'Customers'),
            ('admin', 'Administrators'),
            ('superuser', 'Superusers'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'agent':
            return queryset.filter(
                staff_user_profile__isnull=False
            ).exclude(is_staff=True)
        elif self.value() == 'customer':
            return queryset.filter(
                is_staff=False,
                staff_user_profile__isnull=True
            )
        elif self.value() == 'admin':
            return queryset.filter(is_staff=True, is_superuser=False)
        elif self.value() == 'superuser':
            return queryset.filter(is_superuser=True)
        return queryset
```

### 4.3 Inline Admin Classes

```python
class MotorQuotationInline(admin.TabularInline):
    """Display user's motor quotations inline."""
    model = InsuranceQuotation
    extra = 0
    fields = ('quotation_number', 'insurance_type', 'total_premium', 'status', 'created_at')
    readonly_fields = ('quotation_number', 'created_at')
    can_delete = False
    show_change_link = True

    def has_add_permission(self, request, obj=None):
        return False

class ManualQuoteInline(admin.TabularInline):
    """Display user's non-motor quotations inline."""
    model = ManualQuote
    extra = 0
    fields = ('reference', 'line_key', 'computed_premium', 'status', 'created_at')
    readonly_fields = ('reference', 'created_at')
    can_delete = False
    show_change_link = True

    def has_add_permission(self, request, obj=None):
        return False

class CommissionInline(admin.TabularInline):
    """Display agent's commission records inline."""
    model = AgentCommission
    extra = 0
    fields = ('premium_amount', 'commission_rate', 'commission_amount', 'payment_status', 'payment_date')
    readonly_fields = ('commission_amount',)
    can_delete = False
    show_change_link = True

class PerformanceInline(admin.TabularInline):
    """Display agent's performance records inline."""
    model = AgentPerformance
    extra = 0
    fields = ('period', 'target_premium', 'achieved_premium', 'achievement_percentage')
    readonly_fields = ('achievement_percentage',)
    can_delete = False
    show_change_link = True
```

---

## 5. Commission Management Admin

### 5.1 AgentCommissionAdmin

```python
@admin.register(AgentCommission)
class AgentCommissionAdmin(admin.ModelAdmin):
    """Manage agent commissions with payment tracking."""

    list_display = (
        'agent_display',
        'sale_reference',
        'premium_amount',
        'commission_rate',
        'commission_amount',
        'payment_status',
        'payment_date',
        'created_at'
    )

    list_filter = (
        'payment_status',
        'payment_date',
        'created_at',
        'commission_rate'
    )

    search_fields = (
        'agent__email',
        'agent__phonenumber',
        'agent__staff_user_profile__agent_code',
        'payment_reference'
    )

    readonly_fields = ('commission_amount', 'created_at', 'updated_at')

    fieldsets = (
        ('Agent & Sale', {
            'fields': ('agent', 'quotation', 'manual_quote', 'policy')
        }),
        ('Commission Details', {
            'fields': ('premium_amount', 'commission_rate', 'commission_amount')
        }),
        ('Payment Tracking', {
            'fields': ('payment_status', 'payment_date', 'payment_reference', 'notes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )

    actions = ['mark_as_paid', 'mark_as_approved', 'export_commission_report']

    def agent_display(self, obj):
        if hasattr(obj.agent, 'staff_user_profile') and obj.agent.staff_user_profile:
            return f"{obj.agent.staff_user_profile.full_names} ({obj.agent.staff_user_profile.agent_code})"
        return obj.agent.email
    agent_display.short_description = 'Agent'

    def sale_reference(self, obj):
        if obj.quotation:
            return f"Motor: {obj.quotation.quotation_number}"
        elif obj.manual_quote:
            return f"{obj.manual_quote.line_key}: {obj.manual_quote.reference}"
        elif obj.policy:
            return f"Policy: {obj.policy.policy_number}"
        return '-'
    sale_reference.short_description = 'Sale Reference'

    def save_model(self, request, obj, form, change):
        # Auto-calculate commission amount
        obj.commission_amount = (obj.premium_amount * obj.commission_rate) / 100
        super().save_model(request, obj, form, change)

    def mark_as_paid(self, request, queryset):
        updated = queryset.update(
            payment_status='PAID',
            payment_date=timezone.now().date()
        )
        self.message_user(request, f"{updated} commissions marked as paid.")
    mark_as_paid.short_description = "Mark as Paid"

    def mark_as_approved(self, request, queryset):
        updated = queryset.update(payment_status='APPROVED')
        self.message_user(request, f"{updated} commissions approved.")
    mark_as_approved.short_description = "Mark as Approved"
```

---

## 6. Agent Performance Admin

### 6.1 AgentPerformanceAdmin

```python
@admin.register(AgentPerformance)
class AgentPerformanceAdmin(admin.ModelAdmin):
    """Manage agent performance targets and tracking."""

    list_display = (
        'agent_display',
        'period',
        'target_premium',
        'achieved_premium',
        'achievement_percentage',
        'target_policies',
        'achieved_policies'
    )

    list_filter = ('period', 'period_start')

    search_fields = (
        'agent__email',
        'agent__staff_user_profile__agent_code',
        'period'
    )

    readonly_fields = ('achievement_percentage', 'created_at', 'updated_at')

    fieldsets = (
        ('Agent & Period', {
            'fields': ('agent', 'period', 'period_start', 'period_end')
        }),
        ('Targets', {
            'fields': ('target_policies', 'target_premium')
        }),
        ('Achievements', {
            'fields': ('achieved_policies', 'achieved_premium', 'achievement_percentage')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )

    actions = ['update_achievements', 'export_performance_report']

    def agent_display(self, obj):
        if hasattr(obj.agent, 'staff_user_profile') and obj.agent.staff_user_profile:
            return f"{obj.agent.staff_user_profile.full_names} ({obj.agent.staff_user_profile.agent_code})"
        return obj.agent.email
    agent_display.short_description = 'Agent'

    def update_achievements(self, request, queryset):
        """Recalculate achievements from actual sales data."""
        for performance in queryset:
            # Calculate from InsuranceQuotation and ManualQuote
            motor_stats = InsuranceQuotation.objects.filter(
                agent=performance.agent,
                created_at__range=(performance.period_start, performance.period_end)
            ).aggregate(
                total=Sum('total_premium'),
                count=Count('id')
            )

            manual_stats = ManualQuote.objects.filter(
                agent=performance.agent,
                created_at__range=(performance.period_start, performance.period_end)
            ).aggregate(
                total=Sum('computed_premium'),
                count=Count('id')
            )

            performance.achieved_premium = (motor_stats['total'] or 0) + (manual_stats['total'] or 0)
            performance.achieved_policies = (motor_stats['count'] or 0) + (manual_stats['count'] or 0)
            performance.save()

        self.message_user(request, f"Updated {queryset.count()} performance records.")
    update_achievements.short_description = "Update Achievements from Sales Data"
```

---

## 7. Proxy Models for Role-Based Views

### 7.1 Agent Proxy Model

```python
class AgentUserProxy(User):
    """Proxy model to display only agent users."""
    class Meta:
        proxy = True
        verbose_name = 'Agent'
        verbose_name_plural = 'Agents'

@admin.register(AgentUserProxy)
class AgentUserAdmin(EnhancedUserAdmin):
    """Admin for agent users only."""

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.filter(staff_user_profile__isnull=False).exclude(is_staff=True)

    # Simplified fieldsets for agents
    fieldsets = (
        ('Agent Information', {
            'fields': ('email', 'phonenumber', 'agent_code_display', 'is_active')
        }),
        ('Performance', {
            'fields': ('performance_summary', 'commission_summary', 'quote_summary')
        }),
        ('Account Details', {
            'fields': ('date_joined', 'last_login'),
            'classes': ('collapse',)
        }),
    )
```

### 7.2 Customer Proxy Model

```python
class CustomerUserProxy(User):
    """Proxy model to display only customer users."""
    class Meta:
        proxy = True
        verbose_name = 'Customer'
        verbose_name_plural = 'Customers'

@admin.register(CustomerUserProxy)
class CustomerUserAdmin(EnhancedUserAdmin):
    """Admin for customer users only."""

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.filter(is_staff=False, staff_user_profile__isnull=True)

    list_display = ('email_or_phone', 'total_policies', 'is_active', 'date_joined')

    fieldsets = (
        ('Customer Information', {
            'fields': ('email', 'phonenumber', 'is_active')
        }),
        ('Policies & Quotes', {
            'fields': ('quote_summary',)
        }),
        ('Account Details', {
            'fields': ('date_joined', 'last_login')
        }),
    )

    inlines = [MotorQuotationInline, ManualQuoteInline]
```

---

## 8. Implementation Steps

### Step 1: Create New Models

1. Create `AgentCommission` model in `models.py`
2. Create `AgentPerformance` model in `models.py`
3. Run migrations: `python manage.py makemigrations && python manage.py migrate`

### Step 2: Update Admin.py

1. Import new models
2. Create `EnhancedUserAdmin` class
3. Create inline classes (MotorQuotationInline, ManualQuoteInline, CommissionInline, PerformanceInline)
4. Create `RoleFilter` custom filter
5. Create proxy models (AgentUserProxy, CustomerUserProxy)
6. Register all admin classes

### Step 3: Create Admin Actions

1. Implement `promote_to_agent` action
2. Implement `calculate_commissions` action
3. Implement `export_agent_report` action
4. Implement commission payment actions

### Step 4: Add Commission Calculation Logic

1. Create signal or admin action to auto-generate commissions when quotes are completed
2. Implement commission calculation based on premium and rate
3. Add commission payment workflow

### Step 5: Add Performance Tracking

1. Create management command to auto-create monthly performance records
2. Implement achievement update logic
3. Add performance dashboard in admin

### Step 6: Update Templates (Optional)

1. Create custom admin template for user change form
2. Add charts/graphs for performance visualization
3. Add commission payment forms

### Step 7: Testing

1. Test user role filtering
2. Test commission calculations
3. Test performance tracking
4. Test inline displays
5. Test admin actions

---

## 9. UI/UX Enhancements

### 9.1 Dashboard Widgets

Add to admin index page:

- Top performing agents (by premium)
- Pending commission approvals count
- New agents this month
- Total commissions paid this month

### 9.2 Custom List Displays

- Color-coded role badges (Agent=green, Customer=gray, Admin=blue)
- Commission payment status indicators
- Performance achievement progress bars

### 9.3 Quick Links

From user detail page:

- "View all quotes" → Filtered quotation list
- "View commissions" → Filtered commission list
- "View performance" → Performance records
- "Generate report" → PDF/Excel export

---

## 10. Security Considerations

### 10.1 Permissions

- Only superusers can promote users to agents
- Only staff with `change_agentcommission` can mark commissions as paid
- Agents cannot see other agents' commissions
- Customers cannot access admin panel

### 10.2 Data Privacy

- Mask sensitive customer data in exports
- Audit log for commission payments
- Secure commission payment references

---

## 11. Future Enhancements

### 11.1 Phase 2 Features

- Commission payment batch processing
- Agent tier system (Bronze, Silver, Gold based on performance)
- Commission advance requests
- Agent referral tracking
- Customer lifetime value tracking

### 11.2 Reporting

- Monthly agent performance reports
- Commission reconciliation reports
- Customer acquisition reports
- Revenue attribution reports

---

## 12. Database Migration Strategy

### Migration Order:

1. Add `user_role` field to User model (optional)
2. Create `AgentCommission` model
3. Create `AgentPerformance` model
4. Backfill existing data:
   - Calculate historical commissions from existing quotations
   - Create initial performance records for agents

### Data Migration Script:

```python
# In a data migration file
def create_initial_commissions(apps, schema_editor):
    AgentCommission = apps.get_model('app', 'AgentCommission')
    InsuranceQuotation = apps.get_model('app', 'InsuranceQuotation')

    for quote in InsuranceQuotation.objects.filter(status='COMPLETED'):
        if quote.agent and quote.total_premium:
            AgentCommission.objects.get_or_create(
                agent=quote.agent,
                quotation=quote,
                defaults={
                    'premium_amount': quote.total_premium,
                    'commission_rate': 15.00,  # Default rate
                    'commission_amount': quote.total_premium * 0.15,
                    'payment_status': 'PENDING'
                }
            )
```

---

## 13. API Endpoints (For Mobile App)

### 13.1 Agent Dashboard API

```
GET /api/v1/agent/dashboard/
Response:
{
  "agent_code": "PB-AG-001",
  "total_quotes": 45,
  "total_premium": 2500000,
  "total_commission": 375000,
  "pending_commission": 125000,
  "current_month_performance": {
    "target": 500000,
    "achieved": 380000,
    "percentage": 76.0
  }
}
```

### 13.2 Commission History API

```
GET /api/v1/agent/commissions/
Response:
{
  "results": [
    {
      "id": "uuid",
      "sale_reference": "QUOTE-2025-001",
      "premium_amount": 50000,
      "commission_amount": 7500,
      "payment_status": "PAID",
      "payment_date": "2025-01-15"
    }
  ]
}
```

---

## 14. Success Metrics

### KPIs to Track:

1. **Agent Productivity**: Average quotes per agent per month
2. **Commission Efficiency**: Time from quote completion to commission payment
3. **Performance Achievement**: % of agents meeting targets
4. **User Growth**: New agents and customers per month
5. **Revenue Attribution**: Premium generated per agent

---

## 15. Documentation Requirements

### Admin User Guide:

1. How to add new agents
2. How to calculate and approve commissions
3. How to set performance targets
4. How to generate reports
5. How to manage user roles

### Agent User Guide:

1. How to view commission status in app
2. How to track performance targets
3. How to request commission payments

---

## Conclusion

This specification provides a comprehensive roadmap for implementing a robust user management system in the PataBima Django admin. The system will enable administrators to:

- Manage users by role (Agents, Customers, Admins)
- Track and manage agent commissions
- Monitor agent performance against targets
- View complete user activity history
- Access all user-related data from a single interface

The implementation should be done in phases, starting with core models and admin interfaces, then adding advanced features like automated commission calculation and performance dashboards.

**Next Steps:**

1. Review and approve this specification
2. Create the new models (AgentCommission, AgentPerformance)
3. Implement EnhancedUserAdmin with inlines
4. Test with sample data
5. Deploy to staging environment
6. Train admin users
7. Deploy to production

---

**Document Version:** 1.0  
**Last Updated:** October 10, 2025  
**Author:** PataBima Development Team
