# Django Admin Consolidation Plan

## Current Issues (Duplicates Visible in Screenshot)

1. **User Management Section** appears multiple times
2. **Agent Performance & Commission** appears multiple times
3. **Motor Insurance** section appears multiple times
4. **Product Configuration** appears multiple times
5. **Pricing & Rates** appears multiple times
6. **Non-Motor Insurance** with 6 separate quote proxies

## Root Causes

1. **Proxy Models**: 6 separate ManualQuote proxy models (Medical, Travel, WIBA, Last Expense, Domestic Package, Personal Accident)
2. **Side-effect imports**: campaign_admin, document_admin, admin_enhancements imported with side effects
3. **Potential duplicate registrations** from admin.site.register and @admin.register

## Recommended Fixes

### Option 1: Consolidate Manual Quotes (RECOMMENDED)

Instead of 6 proxy models, use ONE admin with filtering:

```python
@admin.register(ManualQuote)
class ManualQuoteAdmin(admin.ModelAdmin):
    list_display = ("reference", "line_key", "agent_name", "status", "computed_premium", "created_at")
    list_filter = ("line_key", "status", "created_at")  # Filter by type instead of separate models
    search_fields = ("reference", "agent__email", "agent__phonenumber")

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # Optional: filter by line_key if coming from changelist with filter
        line_key = request.GET.get('line_key')
        if line_key:
            return qs.filter(line_key=line_key)
        return qs
```

**Remove all proxy models**:

- MedicalManualQuoteProxy
- LastExpenseManualQuoteProxy
- TravelManualQuoteProxy
- WIBAManualQuoteProxy
- DomesticPackageManualQuoteProxy
- PersonalAccidentManualQuoteProxy

### Option 2: Use Custom Admin Site

Create custom admin sections with grouping:

```python
from django.contrib.admin import AdminSite

class PataBimaAdminSite(AdminSite):
    site_header = "PataBima Insurance Administration"
    site_title = "PataBima Admin"
    index_title = "Insurance Management"

    def get_app_list(self, request):
        app_list = super().get_app_list(request)
        # Custom grouping logic
        return app_list

patabima_admin = PataBimaAdminSite(name='patabima_admin')
```

### Option 3: Use ModelAdmin.get_model_perms() to Hide Duplicates

```python
class HiddenModelAdmin(admin.ModelAdmin):
    def get_model_perms(self, request):
        """Return empty perms dict thus hiding the model from admin index."""
        return {}
```

## Implementation Steps

1. **Backup current admin.py**
2. **Remove proxy model registrations** (lines 392-468)
3. **Consolidate ManualQuote admin** with line_key filter
4. **Test admin interface**
5. **Verify no duplicates**

## Files to Modify

1. `insurance-app/app/admin.py` - Remove proxy models
2. `insurance-app/app/models.py` - Remove proxy model classes (optional)
3. `insurance-app/app/admin_enhancements.py` - Check for duplicate registrations

## Expected Result

**Before**:

- 6 separate "Manual Quote" entries in Non-Motor Insurance
- Duplicate sections throughout

**After**:

- 1 "Manual Quote" entry with filtering by type
- Clean, organized admin interface
- All functionality preserved
