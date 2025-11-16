"""Django admin registrations for PataBima insurance app.

This file was rewritten to remove tab characters and fix indentation errors
that previously caused a TabError during import. Only spaces are used.
"""

import os
from decimal import Decimal

from django.contrib import admin, messages
from django.shortcuts import redirect
from django.utils import timezone
from django.utils.html import format_html
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django.contrib.auth.hashers import make_password

from .models import (
    Underwriter,
    MotorCategory,
    MotorSubcategory,
    MotorPricing,
    InsuranceProvider,
    CommercialTonnagePricing,
    PSVPLLPricing,
    VehicleAdjustmentFactor,
    AdditionalFieldPricing,
    # ExtendiblePricing, PolicyExtension, ExtensionReminder removed - using features.pricing
    InsuranceQuotation,
    MotorInsuranceDetails,
    MotorPolicy,
    ManualQuote,
    AgentCommission,
    AgentPerformance,
    MonthlyAgentBonus,
    CommissionSettings,  # <-- add
    CommissionRule,
)
from .admin_forms import ClonePricingForm, BulkPricingUpdateForm, InsuranceProviderAdminForm, CommissionRuleAdminForm

# Side-effect admin modules (campaigns, documents, etc.)
from . import campaign_admin  # noqa: F401
from . import document_admin  # noqa: F401
from . import admin_enhancements  # noqa: F401

User = get_user_model()

# Removed custom AdminSite (pba-admin) consolidation. Use default admin only.


PRICING_BUILDER_ENABLED = os.environ.get("PRICING_BUILDER_ENABLED", "true").lower() in {"1", "true", "yes"}


@admin.register(InsuranceProvider)
class InsuranceProviderAdmin(admin.ModelAdmin):
    form = InsuranceProviderAdminForm
    list_display = ("name", "code", "display_mode", "is_active")
    search_fields = ("name", "code")
    readonly_fields = ("motor_pricing_link",)
    actions = ["materialize_pricing_from_features"] if PRICING_BUILDER_ENABLED else []
    list_filter = ("display_mode", "is_active")

    fieldsets = (
        (None, {"fields": ("name", "code", "supported_categories", "supported_payment_methods")}),
        ("Contacts", {"fields": ("contact_email", "contact_phone", "address")}),
        ("Display Settings", {
            "fields": ("display_mode",),
            "description": "Configure how premiums are displayed for this underwriter in comparisons"
        }),
        (
            "Pricing & Features",
            {
                "description": (
                    "Define per-product pricing under features.pricing. Example:\n\n"
                    "{\n  'pricing': {\n"
                    "    'PRIVATE_TP': { 'pricing_type': 'fixed', 'base_premium': 5200 },\n"
                    "    'PRIVATE_TOR': { 'pricing_type': 'fixed', 'base_premium': 1500 },\n"
                    "    'PRIVATE_COMPREHENSIVE': { 'pricing_type': 'percentage', 'rate': 0.003, 'min_premium': 20000 },\n"
                    "    'PRIVATE_THIRD_PARTY_EXT': {\n"
                    "      'pricing_type': 'fixed',\n"
                    "      'base_premium': 7000,\n"
                    "      'extendible_config': {\n"
                    "        'initial_amount': 3600,\n"
                    "        'balance_amount': 2400,\n"
                    "        'total_annual_premium': 7000,\n"
                    "        'initial_period_days': 30,\n"
                    "        'extension_deadline_days': 30,\n"
                    "        'grace_period_days': 7,\n"
                    "        'penalty_for_late_extension': 0,\n"
                    "        'allow_partial_extension': false\n"
                    "      }\n"
                    "    }\n"
                    "  }\n}\n\n"
                    "✅ Source of truth: features.pricing (regular + extendible).\n"
                    "For extendible products (*_EXT), include extendible_config as shown above.\n"
                    "Keys must match your subcategory codes (e.g., PRIVATE_COMPREHENSIVE)."
                ),
                "fields": ("features",),
            },
        ),
        ("Related", {"fields": ("motor_pricing_link",)}),
    )

    def change_view(self, request, object_id, form_url="", extra_context=None):
        extra_context = extra_context or {}
        categories_with_subcategories = []
        for category in MotorCategory.objects.filter(is_active=True).order_by("sort_order"):
            subcategories = (
                MotorSubcategory.objects.filter(category=category, is_active=True)
                .order_by("subcategory_name")
            )
            if subcategories.exists():
                categories_with_subcategories.append(
                    {
                        "category": category,
                        "subcategories": list(
                            subcategories.values(
                                "subcategory_code",
                                "subcategory_name",
                                "product_type",
                                "pricing_model",
                            )
                        ),
                    }
                )
        extra_context["categories_with_subcategories"] = categories_with_subcategories
        extra_context["pricing_builder_enabled"] = PRICING_BUILDER_ENABLED
        return super().change_view(request, object_id, form_url, extra_context)

    def motor_pricing_link(self, obj):
        if not obj or not obj.pk:
            return "-"
        try:
            namespace = self.admin_site.name
            url = reverse(f"{namespace}:app_motorpricing_changelist")
            url = f"{url}?underwriter__id__exact={obj.pk}"
            return format_html(
                '<a class="button" href="{}">View Motor Pricing for this provider</a>',
                url,
            )
        except Exception:  # noqa: BLE001
            return format_html("<span>Motor Pricing (URL not available)</span>")

    motor_pricing_link.short_description = "Motor Pricing"  # type: ignore

    def materialize_pricing_from_features(self, request, queryset):
        if not PRICING_BUILDER_ENABLED:
            self.message_user(
                request,
                "Pricing Builder is disabled. Set PRICING_BUILDER_ENABLED=true to enable.",
                level=messages.WARNING,
            )
            return

        created = 0
        updated = 0
        skipped = 0
        errors: list[str] = []

        for provider in queryset:
            try:
                features = provider.features if isinstance(provider.features, dict) else {}
                pricing = features.get("pricing") if isinstance(features.get("pricing"), dict) else None
                if not pricing:
                    skipped += 1
                    errors.append(
                        f"{provider.name}: No valid features.pricing configuration found"
                    )
                    continue

                provider_created = 0
                provider_updated = 0

                for code, cfg in pricing.items():
                    try:
                        if not isinstance(cfg, dict):
                            errors.append(
                                f"{provider.name}: Configuration for '{code}' must be an object"
                            )
                            continue

                        subcat = (
                            MotorSubcategory.objects.filter(subcategory_code=code).first()
                        )
                        if not subcat:
                            errors.append(
                                f"{provider.name}: Subcategory '{code}' not found in database"
                            )
                            continue

                        obj, was_created = MotorPricing.objects.get_or_create(
                            underwriter=provider,
                            subcategory=subcat,
                            defaults={
                                "effective_from": timezone.now().date(),
                                "is_active": True,
                            },
                        )

                        ptype = cfg.get("pricing_type")
                        if ptype == "fixed":
                            base = cfg.get("base_premium", 0)
                            try:
                                obj.base_premium = Decimal(str(base))
                            except (ValueError, TypeError):  # noqa: PERF203
                                obj.base_premium = Decimal("0")
                                errors.append(
                                    f"{provider.name}: Invalid base_premium for '{code}': {base}"
                                )
                            if "min_premium" in cfg:
                                try:
                                    obj.minimum_premium = Decimal(str(cfg["min_premium"]))
                                except (ValueError, TypeError):
                                    errors.append(
                                        f"{provider.name}: Invalid min_premium for '{code}': {cfg['min_premium']}"
                                    )
                            obj.bracket_pricing = None
                            obj.pricing_factors = {"pricing_type": "fixed"}
                            obj.maximum_premium = None
                        elif ptype == "percentage":
                            rate = cfg.get("rate")
                            try:
                                rate_val = float(rate) if rate is not None else None
                            except (ValueError, TypeError):
                                rate_val = None
                                errors.append(
                                    f"{provider.name}: Invalid rate for '{code}': {rate}"
                                )
                            obj.pricing_factors = {
                                "pricing_type": "percentage",
                                "rate": rate_val,
                            }
                            if "min_premium" in cfg:
                                try:
                                    obj.minimum_premium = Decimal(str(cfg["min_premium"]))
                                except (ValueError, TypeError):
                                    errors.append(
                                        f"{provider.name}: Invalid min_premium for '{code}': {cfg['min_premium']}"
                                    )
                            if "max_premium" in cfg:
                                try:
                                    obj.maximum_premium = Decimal(str(cfg["max_premium"]))
                                except (ValueError, TypeError):
                                    errors.append(
                                        f"{provider.name}: Invalid max_premium for '{code}': {cfg['max_premium']}"
                                    )
                            if (
                                "bracket_pricing" in cfg
                                and isinstance(cfg["bracket_pricing"], dict)
                            ):
                                obj.bracket_pricing = cfg["bracket_pricing"]
                            obj.base_premium = None
                        else:
                            errors.append(
                                f"{provider.name}: '{code}' invalid pricing_type"
                            )
                            continue

                        if hasattr(obj, "effective_from") and not obj.effective_from:
                            obj.effective_from = timezone.now().date()
                        obj.is_active = True
                        obj.save()

                        if was_created:
                            provider_created += 1
                            created += 1
                        else:
                            provider_updated += 1
                            updated += 1

                        # Note: No ExtendiblePricing sync here anymore. features.pricing is the source of truth.
                    except Exception as e:  # noqa: BLE001
                        errors.append(
                            f"{provider.name}: Error processing '{code}': {e}"
                        )

                if provider_created or provider_updated:
                    self.message_user(
                        request,
                        f"{provider.name}: {provider_created} created, {provider_updated} updated",
                        level=messages.SUCCESS,
                    )
            except Exception as e:  # noqa: BLE001
                skipped += 1
                errors.append(f"{provider.name}: General error: {e}")

        if created or updated:
            self.message_user(
                request,
                f"✅ Materialize complete: {created} created, {updated} updated, {skipped} skipped",
                level=messages.SUCCESS,
            )
        for error in errors[:10]:
            self.message_user(request, f"⚠️ {error}", level=messages.WARNING)
        if len(errors) > 10:
            self.message_user(
                request,
                f"... and {len(errors) - 10} more errors",
                level=messages.WARNING,
            )

    materialize_pricing_from_features.short_description = (  # type: ignore
        "Materialize pricing from features.json"
    )


@admin.register(ManualQuote)
class ManualQuoteAdmin(admin.ModelAdmin):
    list_display = ("reference", "line_key", "agent_name", "status", "computed_premium", "created_at", "days_pending")
    list_filter = ("line_key", "status", "created_at")
    search_fields = ("reference", "agent__email", "agent__phonenumber")
    readonly_fields = ("reference", "created_at", "updated_at", "days_pending")
    actions = ["mark_in_progress", "mark_completed", "mark_rejected"]
    
    fieldsets = (
        (None, {"fields": ("reference", "line_key", "agent", "status")}),
        (
            "Quote Details",
            {
                "fields": ("payload", "preferred_underwriters"),
                "classes": ("collapse",),
            },
        ),
        (
            "Admin Pricing",
            {
                "fields": ("computed_premium", "levies_breakdown", "admin_notes"),
                "description": "Complete pricing calculation and breakdown for the client",
            },
        ),
        ("Timestamps", {"fields": ("created_at", "updated_at", "days_pending")}),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('agent')

    def agent_name(self, obj):
        if hasattr(obj.agent, 'staff_user_profile') and obj.agent.staff_user_profile:
            return f"{obj.agent.staff_user_profile.full_names} ({obj.agent.staff_user_profile.agent_code})"
        return obj.agent.email or str(obj.agent)
    agent_name.short_description = "Agent"

    def days_pending(self, obj):
        if obj.status == 'COMPLETED':
            return "-"
        from django.utils import timezone
        delta = timezone.now().date() - obj.created_at.date()
        return f"{delta.days} days"
    days_pending.short_description = "Days Pending"

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        
        # Add summary statistics
        from .models import ManualQuote
        stats = {
            'pending_medical': ManualQuote.objects.filter(line_key='MEDICAL', status='PENDING_ADMIN_REVIEW').count(),
            'in_progress_medical': ManualQuote.objects.filter(line_key='MEDICAL', status='IN_PROGRESS').count(),
            'completed_today': ManualQuote.objects.filter(status='COMPLETED', updated_at__date=timezone.now().date()).count(),
            'total_pending': ManualQuote.objects.filter(status__in=['PENDING_ADMIN_REVIEW', 'IN_PROGRESS']).count(),
        }
        extra_context['manual_quote_stats'] = stats
        
        return super().changelist_view(request, extra_context)

    def mark_in_progress(self, request, queryset):
        updated = queryset.filter(status='PENDING_ADMIN_REVIEW').update(status='IN_PROGRESS')
        self.message_user(request, f"{updated} quotes marked as in progress.", level=messages.SUCCESS)
    mark_in_progress.short_description = "Mark selected quotes as in progress"

    def mark_completed(self, request, queryset):
        updated = queryset.filter(status__in=['PENDING_ADMIN_REVIEW', 'IN_PROGRESS']).update(status='COMPLETED')
        self.message_user(request, f"{updated} quotes marked as completed.", level=messages.SUCCESS)
    mark_completed.short_description = "Mark selected quotes as completed"

    def mark_rejected(self, request, queryset):
        updated = queryset.filter(status__in=['PENDING_ADMIN_REVIEW', 'IN_PROGRESS']).update(status='REJECTED')
        self.message_user(request, f"{updated} quotes marked as rejected.", level=messages.WARNING)
    mark_rejected.short_description = "Mark selected quotes as rejected"

    # Loosen permissions: allow any staff to see and edit manual quotes in admin
    def has_module_permission(self, request):
        return bool(request.user and request.user.is_staff)

    def has_view_permission(self, request, obj=None):
        return bool(request.user and request.user.is_staff)

    def has_change_permission(self, request, obj=None):
        return bool(request.user and request.user.is_staff)

    def has_add_permission(self, request):
        return bool(request.user and request.user.is_staff)

    def has_delete_permission(self, request, obj=None):
        return bool(request.user and request.user.is_staff)


# ============================================================================
# CONSOLIDATED MANUAL QUOTES - All types in one admin with filtering
# ============================================================================
# Removed 6 proxy models (Medical, Travel, WIBA, Last Expense, Domestic Package, Personal Accident)
# Use the line_key filter in ManualQuoteAdmin above instead


@admin.register(InsuranceQuotation)
class InsuranceQuotationAdmin(admin.ModelAdmin):
    list_display = ("quotation_number", "insurance_type", "agent", "status", "total_premium")
    search_fields = ("quotation_number", "agent__email", "agent__phonenumber")
    list_filter = ("insurance_type", "status")
    readonly_fields = ("quotation_number",)


@admin.register(MotorPricing)
class MotorPricingAdmin(admin.ModelAdmin):
    list_display = ("underwriter", "subcategory", "base_premium", "minimum_premium", "maximum_premium", "effective_from", "is_active")
    list_filter = ("underwriter", "subcategory__category", "is_active")
    search_fields = ("underwriter__name", "subcategory__subcategory_name")


# Underwriter admin removed (legacy model deprecated in favor of InsuranceProvider)
# @admin.register(Underwriter)
# class UnderwriterAdmin(admin.ModelAdmin):
#     list_display = ("company_name", "company_code", "is_active")
#     search_fields = ("company_name", "company_code")


@admin.register(MotorCategory)
class MotorCategoryAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "is_active")
    search_fields = ("code", "name")




@admin.register(MotorInsuranceDetails)
class MotorInsuranceDetailsAdmin(admin.ModelAdmin):
    list_display = ("quotation", "vehicle_make", "vehicle_model", "vehicle_year", "owner_name", "cover_start_date")
    search_fields = ("vehicle_registration", "owner_name", "quotation__quotation_number")
    list_filter = ("vehicle_make", "cover_start_date")


@admin.register(MotorSubcategory)
class MotorSubcategoryAdmin(admin.ModelAdmin):
    list_display = ("subcategory_code", "subcategory_name", "category", "product_type", "pricing_model", "is_active")
    list_filter = ("category", "product_type", "pricing_model", "is_active")
    search_fields = ("subcategory_code", "subcategory_name")


@admin.register(CommercialTonnagePricing)
class CommercialTonnagePricingAdmin(admin.ModelAdmin):
    list_display = ("subcategory", "underwriter", "tonnage_description", "base_premium", "is_active")
    list_filter = ("subcategory", "underwriter", "is_active")


@admin.register(PSVPLLPricing)
class PSVPLLPricingAdmin(admin.ModelAdmin):
    list_display = ("subcategory", "underwriter", "pll_amount", "rate_per_person", "is_active")
    list_filter = ("subcategory", "underwriter", "is_active")


@admin.register(VehicleAdjustmentFactor)
class VehicleAdjustmentFactorAdmin(admin.ModelAdmin):
    list_display = ("factor_type", "factor_key", "factor_value", "is_active")
    list_filter = ("factor_type", "is_active")


@admin.register(AdditionalFieldPricing)
class AdditionalFieldPricingAdmin(admin.ModelAdmin):
    list_display = ("subcategory", "field_code", "effective_from", "is_active")
    list_filter = ("subcategory", "is_active")


# ExtendiblePricingAdmin, PolicyExtensionAdmin, ExtensionReminderAdmin removed
# Using InsuranceProvider.features.pricing instead



class HasCommissionFilter(admin.SimpleListFilter):
    title = 'Has commission'
    parameter_name = 'has_commission'

    def lookups(self, request, model_admin):
        return (
            ('yes', 'Yes'),
            ('no', 'No'),
        )

    def queryset(self, request, queryset):
        val = self.value()
        if val == 'yes':
            return queryset.filter(commissions__isnull=False).distinct()
        if val == 'no':
            return queryset.filter(commissions__isnull=True)
        return queryset


class AgentFilter(admin.SimpleListFilter):
    """Filter policies by agent (user)."""
    title = 'Agent'
    parameter_name = 'agent'

    def lookups(self, request, model_admin):
        # Get all users who have created at least one policy
        agents = User.objects.filter(
            motor_policies__isnull=False
        ).distinct().order_by('email')
        
        # Return tuples of (user_id, display_name)
        return [
            (str(agent.id), f"{agent.email or agent.phonenumber} ({MotorPolicy.objects.filter(user=agent).count()} policies)")
            for agent in agents[:100]  # Limit to first 100 agents for performance
        ]

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(user_id=self.value())
        return queryset


class ProductTypeFilter(admin.SimpleListFilter):
    """Filter policies by product type (Standard vs Extendible)."""
    title = 'Product Type'
    parameter_name = 'product_type'

    def lookups(self, request, model_admin):
        return (
            ('extendible', 'Extendible Products'),
            ('standard', 'Standard Products'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'extendible':
            return queryset.filter(product_details__is_extendible=True)
        elif self.value() == 'standard':
            return queryset.exclude(product_details__is_extendible=True)
        return queryset


@admin.register(MotorPolicy)
class MotorPolicyAdmin(admin.ModelAdmin):
    list_display = (
        "policy_number", 
        "agent_display",
        "client_name_display",
        "vehicle_reg_display",
        "product_display",
        "underwriter_display",
        "transaction_id_display",
        "premium_display",
        "status_badge",
        "cover_start_date", 
        "cover_end_date"
    )
    list_filter = (
        "status", 
        AgentFilter,
        ProductTypeFilter,
        "cover_start_date", 
        "submitted_at",
        HasCommissionFilter
    )
    search_fields = (
        "policy_number", 
        "user__email", 
        "user__phonenumber",
        "client_details__full_name",
        "client_details__email",
        "vehicle_details__registration",
        "vehicle_details__make",
        "vehicle_details__model"
    )
    readonly_fields = (
        "policy_number", 
        "submitted_at",
        "client_info_display",
        "vehicle_info_display",
        "product_info_display",
        "underwriter_info_display",
        "premium_breakdown_display",
        "payment_info_display",
        "extendible_info_display",
        "documents_display",
        "renewal_info_display"
    )
    actions = ['generate_commissions_for_policies', 'activate_policies', 'export_policies']
    
    fieldsets = (
        ('Policy Information', {
            'fields': ('policy_number', 'quote_id', 'status', 'user', 'agent_code')
        }),
        ('Client Details', {
            'fields': ('client_info_display', 'client_details'),
            'description': 'Client information in human-readable format'
        }),
        ('Vehicle Details', {
            'fields': ('vehicle_info_display', 'vehicle_details'),
            'description': 'Vehicle information in human-readable format'
        }),
        ('Product & Coverage', {
            'fields': ('product_info_display', 'product_details'),
            'description': 'Insurance product and coverage information'
        }),
        ('Underwriter', {
            'fields': ('underwriter_info_display', 'underwriter_details'),
            'description': 'Selected insurance underwriter'
        }),
        ('Premium Breakdown', {
            'fields': ('premium_breakdown_display', 'premium_breakdown'),
            'description': 'Complete premium calculation with levies'
        }),
        ('Payment Information', {
            'fields': ('payment_info_display', 'payment_details'),
            'description': 'Payment method, status, and transaction details'
        }),
        ('Extendible Product Details', {
            'fields': ('extendible_info_display',),
            'classes': ('collapse',),
            'description': 'Balance payment information for extendible products'
        }),
        ('Policy Dates & Coverage', {
            'fields': ('cover_start_date', 'cover_end_date', 'submitted_at', 'approved_at', 'approved_by')
        }),
        ('Documents', {
            'fields': ('documents_display', 'policy_document_url', 'receipt_url', 'certificate_url'),
            'classes': ('collapse',)
        }),
        ('Renewal & Extension Tracking', {
            'fields': ('renewal_info_display', 'original_policy', 'renewal_count', 'is_renewal', 'extension_count'),
            'classes': ('collapse',)
        }),
        ('Additional Information', {
            'fields': ('addons', 'notes'),
            'classes': ('collapse',)
        }),
    )
    
    # ============================================================================
    # Display Methods for List View
    # ============================================================================
    
    def client_name_display(self, obj):
        """Extract and display client name from JSON."""
        if obj.client_details:
            name = obj.client_details.get('full_name') or obj.client_details.get('fullName') or \
                   f"{obj.client_details.get('first_name', '')} {obj.client_details.get('last_name', '')}".strip()
            return name or '-'
        return '-'
    client_name_display.short_description = 'Client Name'
    
    def vehicle_reg_display(self, obj):
        """Extract and display vehicle registration from JSON."""
        if obj.vehicle_details:
            reg = obj.vehicle_details.get('registration') or obj.vehicle_details.get('vehicle_registration')
            return reg or '-'
        return '-'
    vehicle_reg_display.short_description = 'Vehicle Reg'
    
    def product_display(self, obj):
        """Extract and display product name from JSON."""
        if obj.product_details:
            from .utils.product_labels import get_product_label
            subcategory = obj.product_details.get('subcategory')
            if subcategory:
                return get_product_label(subcategory, include_extendible_suffix=True)
            # Fallback to old logic
            category = obj.product_details.get('category', '')
            coverage = obj.product_details.get('coverageType') or obj.product_details.get('coverage_type', '')
            return f"{category} - {coverage}" if coverage else category or '-'
        return '-'
    product_display.short_description = 'Product'
    
    def underwriter_display(self, obj):
        """Extract and display underwriter name from JSON."""
        if obj.underwriter_details:
            name = obj.underwriter_details.get('name') or obj.underwriter_details.get('underwriter_name') or \
                   obj.underwriter_details.get('company') or obj.underwriter_details.get('company_name')
            return name or '-'
        
        # Check if this is an extendible product without underwriter (expected during initial payment)
        if obj.product_details and obj.product_details.get('is_extendible'):
            return '⏳ Extendible - Initial Payment'
        
        return '—'
    underwriter_display.short_description = 'Underwriter'
    
    def transaction_id_display(self, obj):
        """Display payment transaction ID."""
        if obj.payment_details:
            txn_id = obj.payment_details.get('transactionId') or obj.payment_details.get('transaction_id')
            if txn_id:
                # Show full transaction ID with copy-friendly formatting
                return format_html(
                    '<code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-size: 11px;">{}</code>',
                    txn_id
                )
        return '-'
    transaction_id_display.short_description = 'Transaction ID'
    
    def premium_display(self, obj):
        """Extract and display total premium from JSON."""
        if obj.premium_breakdown:
            total = obj.premium_breakdown.get('totalAmount') or \
                    obj.premium_breakdown.get('total_amount') or \
                    obj.premium_breakdown.get('total_premium') or \
                    obj.premium_breakdown.get('totalPremium')
            if total:
                return f"KSh {float(total):,.2f}"
        return '-'
    premium_display.short_description = 'Premium'
    
    def status_badge(self, obj):
        """Display status with color coding."""
        colors = {
            'ACTIVE': '#10B981',
            'DRAFT': '#6B7280',
            'PENDING_PAYMENT': '#F59E0B',
            'EXPIRED': '#DC2626',
            'CANCELLED': '#EF4444',
            'SUSPENDED': '#F59E0B',
        }
        color = colors.get(obj.status, '#6B7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    # ============================================================================
    # Display Methods for Detail View (Formatted JSON)
    # ============================================================================
    
    def client_info_display(self, obj):
        """Format client details in a readable way."""
        if not obj.client_details:
            return '-'
        
        cd = obj.client_details
        html = '<div style="font-family: monospace; line-height: 1.8;">'
        
        # Name
        name = cd.get('full_name') or cd.get('fullName') or \
               f"{cd.get('first_name', '')} {cd.get('last_name', '')}".strip()
        if name:
            html += f'<strong>Name:</strong> {name}<br>'
        
        # Email
        email = cd.get('email')
        if email:
            html += f'<strong>Email:</strong> {email}<br>'
        
        # Phone
        phone = cd.get('phone') or cd.get('phone_number') or cd.get('phoneNumber')
        if phone:
            html += f'<strong>Phone:</strong> {phone}<br>'
        
        # ID Number
        id_num = cd.get('id_number') or cd.get('idNumber')
        if id_num:
            html += f'<strong>ID Number:</strong> {id_num}<br>'
        
        # KRA PIN
        kra = cd.get('kra_pin') or cd.get('kraPin')
        if kra:
            html += f'<strong>KRA PIN:</strong> {kra}<br>'
        
        html += '</div>'
        return format_html(html)
    client_info_display.short_description = 'Client Information'
    
    def vehicle_info_display(self, obj):
        """Format vehicle details in a readable way."""
        if not obj.vehicle_details:
            return '-'
        
        vd = obj.vehicle_details
        html = '<div style="font-family: monospace; line-height: 1.8;">'
        
        # Registration
        reg = vd.get('registration') or vd.get('vehicle_registration')
        if reg:
            html += f'<strong>Registration:</strong> {reg}<br>'
        
        # Make & Model
        make = vd.get('make') or vd.get('vehicle_make')
        model = vd.get('model') or vd.get('vehicle_model')
        if make or model:
            html += f'<strong>Make/Model:</strong> {make} {model}<br>'
        
        # Year
        year = vd.get('year') or vd.get('vehicle_year')
        if year:
            html += f'<strong>Year:</strong> {year}<br>'
        
        # Chassis & Engine
        chassis = vd.get('chassis_number') or vd.get('chassisNumber')
        if chassis:
            html += f'<strong>Chassis:</strong> {chassis}<br>'
        
        engine = vd.get('engine_number') or vd.get('engineNumber')
        if engine:
            html += f'<strong>Engine:</strong> {engine}<br>'
        
        # Sum Insured
        sum_insured = vd.get('sum_insured') or vd.get('sumInsured') or vd.get('vehicle_value')
        if sum_insured:
            html += f'<strong>Sum Insured:</strong> KSh {float(sum_insured):,.2f}<br>'
        
        # Color
        color = vd.get('color') or vd.get('vehicle_color')
        if color:
            html += f'<strong>Color:</strong> {color}<br>'
        
        # Seating Capacity
        capacity = vd.get('seating_capacity') or vd.get('passengerCapacity') or vd.get('passenger_capacity')
        if capacity:
            html += f'<strong>Seating Capacity:</strong> {capacity}<br>'
        
        html += '</div>'
        return format_html(html)
    vehicle_info_display.short_description = 'Vehicle Information'
    
    def product_info_display(self, obj):
        """Format product details in a readable way."""
        if not obj.product_details:
            return '-'
        
        pd = obj.product_details
        html = '<div style="font-family: monospace; line-height: 1.8;">'
        
        # Category
        category = pd.get('category') or pd.get('categoryCode')
        if category:
            html += f'<strong>Category:</strong> {category}<br>'
        
        # Subcategory
        subcategory = pd.get('subcategory') or pd.get('subcategoryCode')
        if subcategory:
            html += f'<strong>Subcategory:</strong> {subcategory}<br>'
        
        # Coverage Type
        coverage = pd.get('coverageType') or pd.get('coverage_type')
        if coverage:
            html += f'<strong>Coverage Type:</strong> {coverage}<br>'
        
        # Pricing Model
        pricing = pd.get('pricingModel') or pd.get('pricing_model')
        if pricing:
            html += f'<strong>Pricing Model:</strong> {pricing}<br>'
        
        # Extendible Flag
        is_ext = pd.get('is_extendible')
        if is_ext:
            html += f'<strong>Extendible Product:</strong> ✅ Yes<br>'
        
        # Payment Plan
        plan = pd.get('payment_plan')
        if plan:
            html += f'<strong>Payment Plan:</strong> {plan.upper()}<br>'
        
        html += '</div>'
        return format_html(html)
    product_info_display.short_description = 'Product Information'
    
    def underwriter_info_display(self, obj):
        """Format underwriter details in a readable way."""
        if not obj.underwriter_details:
            return '-'
        
        ud = obj.underwriter_details
        html = '<div style="font-family: monospace; line-height: 1.8;">'
        
        # Name
        name = ud.get('name') or ud.get('underwriter_name')
        if name:
            html += f'<strong>Name:</strong> {name}<br>'
        
        # Company
        company = ud.get('company') or ud.get('company_name')
        if company:
            html += f'<strong>Company:</strong> {company}<br>'
        
        # ID
        uid = ud.get('id')
        if uid:
            html += f'<strong>Underwriter ID:</strong> {uid}<br>'
        
        html += '</div>'
        return format_html(html)
    underwriter_info_display.short_description = 'Underwriter Information'
    
    def premium_breakdown_display(self, obj):
        """Format premium breakdown in a readable way."""
        if not obj.premium_breakdown:
            return '-'
        
        pb = obj.premium_breakdown
        html = '<div style="font-family: monospace; line-height: 1.8;">'
        
        # Base Premium
        base = pb.get('base_premium') or pb.get('basePremium')
        if base:
            html += f'<strong>Base Premium:</strong> KSh {float(base):,.2f}<br>'
        
        # Training Levy (ITL)
        itl = pb.get('training_levy') or pb.get('trainingLevy') or pb.get('itl')
        if itl:
            html += f'<strong>Training Levy (ITL):</strong> KSh {float(itl):,.2f}<br>'
        
        # PCF Levy
        pcf = pb.get('pcf_levy') or pb.get('pcfLevy') or pb.get('pcf')
        if pcf:
            html += f'<strong>PCF Levy:</strong> KSh {float(pcf):,.2f}<br>'
        
        # Stamp Duty
        stamp = pb.get('stamp_duty') or pb.get('stampDuty')
        if stamp:
            html += f'<strong>Stamp Duty:</strong> KSh {float(stamp):,.2f}<br>'
        
        # Total
        total = pb.get('total_premium') or pb.get('totalPremium') or pb.get('total_amount') or pb.get('totalAmount')
        if total:
            html += f'<strong style="color: #D5222B; font-size: 1.1em;">TOTAL PREMIUM:</strong> <strong style="color: #D5222B; font-size: 1.1em;">KSh {float(total):,.2f}</strong><br>'
        
        html += '</div>'
        return format_html(html)
    premium_breakdown_display.short_description = 'Premium Breakdown'
    
    def payment_info_display(self, obj):
        """Format payment details in a readable way."""
        if not obj.payment_details:
            return '-'
        
        pd = obj.payment_details
        html = '<div style="font-family: monospace; line-height: 1.8;">'
        
        # Method
        method = pd.get('method') or pd.get('paymentMethod')
        if method:
            html += f'<strong>Payment Method:</strong> {method}<br>'
        
        # Amount
        amount = pd.get('amount') or pd.get('paymentAmount')
        if amount:
            html += f'<strong>Amount Paid:</strong> KSh {float(amount):,.2f}<br>'
        
        # Status
        status = pd.get('status') or pd.get('paymentStatus')
        if status:
            color = '#10B981' if status == 'CONFIRMED' else '#F59E0B'
            html += f'<strong>Status:</strong> <span style="color: {color}; font-weight: bold;">{status}</span><br>'
        
        # Transaction ID
        txn = pd.get('transaction_id') or pd.get('transactionId')
        if txn:
            html += f'<strong>Transaction ID:</strong> {txn}<br>'
        
        # Payment Date
        pdate = pd.get('paymentDate') or pd.get('payment_date')
        if pdate:
            html += f'<strong>Payment Date:</strong> {pdate}<br>'
        
        html += '</div>'
        return format_html(html)
    payment_info_display.short_description = 'Payment Information'
    
    def extendible_info_display(self, obj):
        """Format extendible product details in a readable way."""
        # Check if this is an extendible product
        if not obj.product_details or not obj.product_details.get('is_extendible'):
            return format_html('<em style="color: #6B7280;">Not an extendible product</em>')
        
        # Look for extendible_config in product_details
        ext_config = obj.product_details.get('extendible_config') or obj.product_details.get('extendibleConfig')
        if not ext_config:
            return format_html('<em style="color: #F59E0B;">⚠️ Extendible product but config missing</em>')
        
        html = '<div style="font-family: monospace; line-height: 1.8; background: #F3F4F6; padding: 10px; border-radius: 5px;">'
        
        # Initial Amount
        initial = ext_config.get('initial_amount') or ext_config.get('initialAmount')
        if initial:
            html += f'<strong>Initial Amount:</strong> KSh {float(initial):,.2f}<br>'
        
        # Balance Amount
        balance = ext_config.get('balance_amount') or ext_config.get('balanceAmount')
        if balance:
            html += f'<strong>Balance Amount:</strong> <span style="color: #D5222B; font-weight: bold;">KSh {float(balance):,.2f}</span><br>'
        
        # Total Annual Premium
        total = ext_config.get('total_annual_premium') or ext_config.get('totalAnnualPremium')
        if total:
            html += f'<strong>Total Annual Premium:</strong> KSh {float(total):,.2f}<br>'
        
        # Due Days
        due_days = ext_config.get('due_days') or ext_config.get('dueDays') or ext_config.get('initial_period_days')
        if due_days:
            html += f'<strong>Balance Due In:</strong> {due_days} days<br>'
        
        # Grace Period
        grace = ext_config.get('grace_period_days') or ext_config.get('gracePeriodDays')
        if grace:
            html += f'<strong>Grace Period:</strong> {grace} days<br>'
        
        # Late Fee
        late_fee = ext_config.get('late_fee_percentage') or ext_config.get('lateFeePercentage')
        if late_fee:
            html += f'<strong>Late Fee:</strong> {float(late_fee)}%<br>'
        
        html += '</div>'
        return format_html(html)
    extendible_info_display.short_description = 'Extendible Product Details'
    
    def documents_display(self, obj):
        """Format documents list in a readable way."""
        if not obj.documents or not isinstance(obj.documents, list):
            return format_html('<em style="color: #6B7280;">No documents uploaded</em>')
        
        html = '<ul style="margin: 0; padding-left: 20px;">'
        for doc in obj.documents:
            if isinstance(doc, dict):
                name = doc.get('name') or doc.get('file_name') or 'Unnamed document'
                url = doc.get('url') or doc.get('file_url')
                if url:
                    html += f'<li><a href="{url}" target="_blank">{name}</a></li>'
                else:
                    html += f'<li>{name}</li>'
            else:
                html += f'<li>{doc}</li>'
        html += '</ul>'
        return format_html(html)
    documents_display.short_description = 'Uploaded Documents'
    
    def renewal_info_display(self, obj):
        """Format renewal/extension tracking info."""
        html = '<div style="font-family: monospace; line-height: 1.8;">'
        
        if obj.is_renewal and obj.original_policy:
            html += f'<strong>This is a renewal of:</strong> {obj.original_policy.policy_number}<br>'
        
        if obj.renewal_count > 0:
            html += f'<strong>Renewal Count:</strong> {obj.renewal_count}<br>'
        
        if obj.extension_count > 0:
            html += f'<strong>Extension Count:</strong> {obj.extension_count}<br>'
        
        if obj.total_extensions_amount and obj.total_extensions_amount > 0:
            html += f'<strong>Total Extensions Amount:</strong> KSh {float(obj.total_extensions_amount):,.2f}<br>'
        
        if not obj.is_renewal and obj.renewal_count == 0 and obj.extension_count == 0:
            html += '<em style="color: #6B7280;">Original policy, no renewals or extensions yet</em>'
        
        html += '</div>'
        return format_html(html)
    renewal_info_display.short_description = 'Renewal & Extension Info'
    
    # ============================================================================
    # Actions
    # ============================================================================
    
    def activate_policies(self, request, queryset):
        """Activate selected policies (admin override)."""
        count = 0
        for policy in queryset:
            if policy.status != 'ACTIVE':
                policy.status = 'ACTIVE'
                policy.save()
                count += 1
        
        self.message_user(
            request,
            f"Successfully activated {count} policy/policies.",
            level=messages.SUCCESS if count > 0 else messages.INFO
        )
    activate_policies.short_description = "Activate selected policies"
    
    def export_policies(self, request, queryset):
        """Export selected policies to CSV."""
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="motor_policies.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Policy Number', 'Client Name', 'Vehicle Reg', 'Product', 
            'Underwriter', 'Premium', 'Status', 'Cover Start', 'Cover End'
        ])
        
        for policy in queryset:
            writer.writerow([
                policy.policy_number,
                self.client_name_display(policy),
                self.vehicle_reg_display(policy),
                self.product_display(policy),
                self.underwriter_display(policy),
                self.premium_display(policy),
                policy.get_status_display(),
                policy.cover_start_date,
                policy.cover_end_date
            ])
        
        return response
    export_policies.short_description = "Export selected policies to CSV"
    
    def has_commission(self, obj):
        """Check if policy has commission record."""
        return obj.commissions.exists()
    has_commission.boolean = True
    has_commission.short_description = 'Has commission'

    # Custom URLs for bulk-all and single creation
    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom = [
            path('generate_commissions/all_active/', self.admin_site.admin_view(self.generate_all_active_view), name='app_motorpolicy_generate_all_active'),
            path('<path:object_id>/create_commission/', self.admin_site.admin_view(self.create_single_commission_view), name='app_motorpolicy_create_commission'),
        ]
        return custom + urls

    def generate_all_active_view(self, request):
        from django.shortcuts import render, redirect
        from django.urls import reverse
        from .services.commissioning import generate_commissions_for_policies as gen

        if request.method == 'POST':
            qs = MotorPolicy.objects.filter(status='ACTIVE', commissions__isnull=True)
            result = gen(qs)
            msg = (
                f"Created {result['created']} commission(s). "
                f"Skipped {result['skipped']}. Errors {result['errors']}."
            )
            level = messages.SUCCESS if result['created'] else messages.INFO
            self.message_user(request, msg, level=level)
            return redirect('admin:app_motorpolicy_changelist')

        context = {
            **self.admin_site.each_context(request),
            'title': 'Generate commissions for ALL ACTIVE policies (no existing commission)',
            'opts': self.model._meta,
            'confirm_url': reverse('admin:app_motorpolicy_generate_all_active'),
        }
        return render(request, 'admin/confirm_generate_all_commissions.html', context)

    def create_single_commission_view(self, request, object_id):
        from django.shortcuts import get_object_or_404, redirect
        from .services.commissioning import generate_commissions_for_policies as gen
        policy = get_object_or_404(MotorPolicy, pk=object_id)
        result = gen([policy])
        if result['created']:
            self.message_user(request, f"Commission created for {policy.policy_number}.", level=messages.SUCCESS)
        elif result['skipped']:
            self.message_user(request, f"Commission already exists for {policy.policy_number}.", level=messages.INFO)
        else:
            why = result['failures'][0][1] if result['failures'] else 'unknown reason'
            self.message_user(request, f"Could not create commission for {policy.policy_number}: {why}", level=messages.ERROR)
        return redirect('admin:app_motorpolicy_changelist')

    def get_list_display(self, request):
        # Inject inline button column
        cols = list(super().get_list_display(request))
        if 'create_commission_button' not in cols:
            cols.append('create_commission_button')
        return cols

    def create_commission_button(self, obj):
        from django.urls import reverse
        if obj.status == 'ACTIVE' and not obj.commissions.exists():
            url = reverse('admin:app_motorpolicy_create_commission', args=[obj.pk])
            return format_html("<a class='button' href='{}'>Create commission</a>", url)
        if obj.commissions.exists():
            return '—'
        return 'Not eligible'
    create_commission_button.short_description = 'Commission'
    
    def agent_display(self, obj):
        """Show agent name if available."""
        if obj.user:
            user = obj.user
            if hasattr(user, 'staff_user_profile') and user.staff_user_profile:
                return f"{user.staff_user_profile.full_names} ({user.staff_user_profile.agent_code})"
            return user.email or user.phonenumber
        return '-'
    agent_display.short_description = 'Agent'
    
    def generate_commissions_for_policies(self, request, queryset):
        """Generate commission records for selected ACTIVE policies."""
        from .services.commissioning import generate_commissions_for_policies as gen

        active_policies = queryset.filter(status='ACTIVE')
        if not active_policies.exists():
            self.message_user(
                request,
                "No ACTIVE (paid) policies selected. Commissions are only created for paid policies.",
                level=messages.WARNING,
            )
            return

        result = gen(active_policies)
        created_count = result['created']
        skipped_count = result['skipped']
        error_count = result['errors']
        failures = result['failures']

        if created_count > 0:
            self.message_user(
                request,
                f"Successfully created {created_count} commission(s). Skipped {skipped_count} duplicate(s). {error_count} error(s).",
                level=messages.SUCCESS,
            )
        elif skipped_count > 0:
            self.message_user(
                request,
                f"All {skipped_count} selected policies already have commission records.",
                level=messages.INFO,
            )
        else:
            detail = ''
            if failures:
                sample = ', '.join([f"{pn} ({why})" for pn, why in failures[:5]])
                more = '' if len(failures) <= 5 else f" … +{len(failures)-5} more"
                detail = f" Details: {sample}{more}."
            self.message_user(
                request,
                f"Could not create commissions. {error_count} policies had errors (missing agent or premium data).{detail}",
                level=messages.ERROR,
            )
    
    generate_commissions_for_policies.short_description = "Generate commissions for selected policies"


@admin.register(CommissionSettings)
class CommissionSettingsAdmin(admin.ModelAdmin):
    list_display = ('default_commission_rate', 'updated_at')
    fields = ('default_commission_rate', 'apply_global_rate_now')
    readonly_fields = ('apply_global_rate_now',)
    actions = ['apply_rate_to_all_commissions']

    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom = [
            path('<path:object_id>/apply/', self.admin_site.admin_view(self.apply_now_view), name='app_commissionsettings_apply'),
        ]
        return custom + urls

    def apply_global_rate_now(self, obj):
        if not obj or not obj.pk:
            return "-"
        try:
            namespace = self.admin_site.name
            url = reverse(f"{namespace}:app_commissionsettings_apply", args=[obj.pk])
            return format_html('<a class="button" href="{}">Apply global rate to ALL commissions now</a>', url)
        except Exception:
            return "-"
    apply_global_rate_now.short_description = 'Quick action'
    apply_global_rate_now.allow_tags = True

    def apply_now_view(self, request, object_id):
        from decimal import Decimal, ROUND_HALF_UP
        settings_obj = self.get_object(request, object_id)
        if not settings_obj:
            self.message_user(request, "Settings not found.", level=messages.ERROR)
            return redirect('admin:app_commissionsettings_changelist')

        rate = settings_obj.default_commission_rate
        updated = 0
        for obj in AgentCommission.objects.all().iterator():
            try:
                obj.commission_rate = rate
                obj.commission_amount = (
                    Decimal(obj.premium_amount or 0) * Decimal(rate) / Decimal('100')
                ).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                obj.save(update_fields=['commission_rate', 'commission_amount', 'date_updated'])
                updated += 1
            except Exception:
                continue
        self.message_user(request, f"Applied global commission rate ({rate}%) to {updated} commission(s).", level=messages.SUCCESS)
        return redirect('admin:app_commissionsettings_change', object_id)

    def apply_rate_to_all_commissions(self, request, queryset):
        """Bulk action (from list view): apply current global rate to ALL commissions."""
        from decimal import Decimal, ROUND_HALF_UP
        try:
            rate = CommissionSettings.get_solo().default_commission_rate
        except Exception:
            rate = Decimal('15.00')
        updated = 0
        for obj in AgentCommission.objects.all().iterator():
            try:
                obj.commission_rate = rate
                obj.commission_amount = (
                    Decimal(obj.premium_amount or 0) * Decimal(rate) / Decimal('100')
                ).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                obj.save(update_fields=['commission_rate', 'commission_amount', 'date_updated'])
                updated += 1
            except Exception:
                continue
        self.message_user(request, f"Applied global commission rate ({rate}%) to {updated} commission(s).", level=messages.SUCCESS)
    apply_rate_to_all_commissions.short_description = "Apply global rate to ALL commissions"


@admin.register(CommissionRule)
class CommissionRuleAdmin(admin.ModelAdmin):
    form = CommissionRuleAdminForm
    list_display = ('name', 'rate', 'priority', 'is_active', 'subcategory', 'underwriter', 'line_key', 'effective_start', 'effective_end')
    list_filter = ('is_active', 'line_key', 'effective_start', 'effective_end', 'priority')
    search_fields = ('name', 'subcategory__subcategory_code', 'underwriter__name', 'underwriter__code', 'line_key')
    fields = (
        'name', 'rate', 'priority', 'is_active',
        ('subcategory', 'underwriter', 'line_key'),
        ('effective_start', 'effective_end'),
    )


# Note: All admin registrations are on the default admin site only.


# ============================================================================
# USER MANAGEMENT ADMIN - Comprehensive User Administration
# ============================================================================

from django.db.models import Sum, Count, Q


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
            return queryset.filter(is_admin=True)
        elif self.value() == 'superuser':
            return queryset.filter(is_admin=True, is_staff=True)
        return queryset


class MotorQuotationInline(admin.TabularInline):
    """Display user's motor quotations inline."""
    model = InsuranceQuotation
    extra = 0
    fields = ('quotation_number', 'insurance_type', 'total_premium', 'status', 'date_created')
    readonly_fields = ('quotation_number', 'date_created')
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
    
    def has_add_permission(self, request, obj=None):
        return False


class PerformanceInline(admin.TabularInline):
    """Display agent's performance records inline."""
    model = AgentPerformance
    extra = 0
    fields = ('period', 'target_premium', 'achieved_premium', 'achievement_percentage')
    readonly_fields = ('achievement_percentage',)
    can_delete = False
    show_change_link = True
    
    def has_add_permission(self, request, obj=None):
        return False


@admin.register(User)
class EnhancedUserAdmin(admin.ModelAdmin):
    """Enhanced User admin with role-based management and comprehensive user data."""
    
    # Add form customization for secure password handling
    add_form = UserCreationForm
    form = UserChangeForm
    
    list_display = (
        'email_or_phone',
        'user_role_display',
        'agent_code_display',
        'total_quotes',
        'total_commission',
        'is_active',
        'date_created'
    )
    
    list_filter = (
        'is_staff',
        'is_active',
        'is_admin',
        'date_created',
        RoleFilter,
    )
    
    search_fields = (
        'email',
        'phonenumber',
        'staff_user_profile__agent_code',
        'staff_user_profile__full_names'
    )
    
    readonly_fields = (
        'date_created',
        'date_updated',
        'last_login',
        'agent_code_display',
        'performance_summary',
        'commission_summary',
        'quote_summary',
        'profile_link',
    )
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('email', 'phonenumber')
        }),
        ('Security', {
            'fields': ('password',),
            'description': 'Use the "Change password" link in the top right to update password securely.'
        }),
        ('Role & Permissions', {
            'fields': ('is_active', 'is_staff', 'is_admin', 'role')
        }),
        ('Agent Details', {
            'fields': ('agent_code_display', 'performance_summary'),
            'classes': ('collapse',),
        }),
        ('Activity Summary', {
            'fields': ('profile_link', 'quote_summary', 'commission_summary', 'date_created', 'date_updated', 'last_login'),
        }),
    )
    
    add_fieldsets = (
        ('Create New User', {
            'classes': ('wide',),
            'fields': ('phonenumber', 'email', 'role', 'password1', 'password2', 'is_active', 'is_staff'),
            'description': 'Create a new agent or customer. Password will be securely hashed.'
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
        'export_user_report',
        'create_agent_profiles',
    ]

    # --- Custom profile link and view ---
    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom = [
            path('<path:object_id>/profile/', self.admin_site.admin_view(self.profile_view), name='app_user_profile'),
        ]
        return custom + urls

    def profile_link(self, obj):
        if not obj or not obj.pk:
            return '-'
        try:
            namespace = self.admin_site.name
            url = reverse(f"{namespace}:app_user_profile", args=[obj.pk])
            return format_html('<a class="button" href="{}">Open full profile</a>', url)
        except Exception:
            return '-'
    profile_link.short_description = 'Profile'

    def profile_view(self, request, object_id):
        from django.shortcuts import get_object_or_404, render
        user = get_object_or_404(User, pk=object_id)

        # Build quick stats
        motor_quotes_qs = InsuranceQuotation.objects.filter(agent=user).order_by('-date_created')
        manual_quotes_qs = ManualQuote.objects.filter(agent=user).order_by('-created_at')
        policies_qs = MotorPolicy.objects.filter(user=user).order_by('-submitted_at')
        commissions_qs = AgentCommission.objects.filter(agent=user).order_by('-date_created')
        bonuses_qs = MonthlyAgentBonus.objects.filter(agent=user).order_by('-date_created')

        stats = {
            'total_motor_quotes': motor_quotes_qs.count(),
            'total_manual_quotes': manual_quotes_qs.count(),
            'active_policies': policies_qs.filter(status='ACTIVE').count(),
            'total_commission': commissions_qs.aggregate(total=Sum('commission_amount'))['total'] or Decimal('0'),
        }

        context = {
            **self.admin_site.each_context(request),
            'title': f"User Profile: {user.email or user.phonenumber}",
            'opts': self.model._meta,
            'original': user,
            'stats': stats,
            'recent_motor_quotes': list(motor_quotes_qs[:10]),
            'recent_manual_quotes': list(manual_quotes_qs[:10]),
            'recent_policies': list(policies_qs[:10]),
            'recent_commissions': list(commissions_qs[:10]),
            'recent_bonuses': list(bonuses_qs[:10]),
            'links': {
                'motor_quotes': f"{reverse('admin:app_insurancequotation_changelist')}?agent__id__exact={user.pk}",
                'manual_quotes': f"{reverse('admin:app_manualquote_changelist')}?agent__id__exact={user.pk}",
                'policies': f"{reverse('admin:app_motorpolicy_changelist')}?user__id__exact={user.pk}",
                'commissions': f"{reverse('admin:app_agentcommission_changelist')}?agent__id__exact={user.pk}",
                'bonuses': f"{reverse('admin:app_monthlyagentbonus_changelist')}?agent__id__exact={user.pk}",
                'back_to_user': reverse(f"{self.admin_site.name}:app_user_change", args=[user.pk]),
            }
        }

        return render(request, 'admin/app/user/profile.html', context)
    
    # Custom methods
    def email_or_phone(self, obj):
        return obj.email or obj.phonenumber
    email_or_phone.short_description = 'Contact'
    
    def user_role_display(self, obj):
        if obj.is_admin:
            return format_html('<span style="color: red; font-weight: bold;">●</span> Administrator')
        elif obj.is_staff:
            return format_html('<span style="color: blue; font-weight: bold;">●</span> Staff')
        elif hasattr(obj, 'staff_user_profile') and obj.staff_user_profile:
            return format_html('<span style="color: green; font-weight: bold;">●</span> Agent')
        else:
            return format_html('<span style="color: gray;">●</span> Customer')
    user_role_display.short_description = 'Role'
    
    def agent_code_display(self, obj):
        if hasattr(obj, 'staff_user_profile') and obj.staff_user_profile:
            prefix = obj.staff_user_profile.agent_prefix or 'AGT'
            code = obj.staff_user_profile.agent_code
            return f"{prefix}-{code}"
        return '-'
    agent_code_display.short_description = 'Agent Code'
    
    def total_quotes(self, obj):
        motor = InsuranceQuotation.objects.filter(agent=obj).count()
        manual = ManualQuote.objects.filter(agent=obj).count()
        total = motor + manual
        if total > 0:
            try:
                url = reverse('admin:app_insurancequotation_changelist') + f'?agent__id__exact={obj.pk}'
                return format_html('<a href="{}">{}</a>', url, total)
            except:  # noqa: E722
                return str(total)
        return '0'
    total_quotes.short_description = 'Total Quotes'
    
    def total_commission(self, obj):
        total = AgentCommission.objects.filter(agent=obj).aggregate(
            total=Sum('commission_amount')
        )['total'] or Decimal('0')
        if total > 0:
            try:
                url = reverse('admin:app_agentcommission_changelist') + f'?agent__id__exact={obj.pk}'
                return format_html('<a href="{}">KSh {:,.2f}</a>', url, total)
            except:  # noqa: E722
                return f'KSh {total:,.2f}'
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
        )['total'] or Decimal('0')
        
        manual_premium = ManualQuote.objects.filter(agent=obj).aggregate(
            total=Sum('computed_premium')
        )['total'] or Decimal('0')
        
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
    def activate_users(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f"{updated} users activated.", level=messages.SUCCESS)
    activate_users.short_description = "Activate selected users"
    
    def deactivate_users(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated} users deactivated.", level=messages.WARNING)
    deactivate_users.short_description = "Deactivate selected users"
    
    def export_user_report(self, request, queryset):
        # Placeholder for export functionality
        self.message_user(request, "Export functionality coming soon.", level=messages.INFO)
    export_user_report.short_description = "Export user report"
    
    def create_agent_profiles(self, request, queryset):
        """Create StaffUserProfile for selected users to make them agents."""
        from .models import StaffUserProfile
        created = 0
        for user in queryset:
            if not hasattr(user, 'staff_user_profile') or not user.staff_user_profile:
                # Generate agent code
                last_agent = StaffUserProfile.objects.order_by('-agent_code').first()
                next_code = (int(last_agent.agent_code) + 1) if last_agent and last_agent.agent_code else 1001
                
                StaffUserProfile.objects.create(
                    user=user,
                    agent_code=str(next_code).zfill(4),
                    agent_prefix='AGT',
                    full_names=user.email or f"Agent {next_code}",
                )
                user.is_staff = True
                user.role = 'AGENT'
                user.save()
                created += 1
        
        self.message_user(request, f"Created agent profiles for {created} users.", level=messages.SUCCESS)
    create_agent_profiles.short_description = "Convert to Agents (create agent profiles)"
    
    # Override save_model to hash passwords properly
    def save_model(self, request, obj, form, change):
        if not change:  # New user
            # Set created_by to current admin
            obj.created_by = request.user.email or request.user.phonenumber or 'ADMIN'
            # Password is already hashed by UserCreationForm
        elif 'password' in form.changed_data:
            # If password changed manually, hash it
            obj.password = make_password(obj.password)
        super().save_model(request, obj, form, change)


# ============================================================================
# COMMISSION MANAGEMENT ADMIN
# ============================================================================

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
        'date_created'
    )
    
    list_filter = (
        'payment_status',
        'payment_date',
        'date_created',
        'commission_rate'
    )
    
    search_fields = (
        'agent__email',
        'agent__phonenumber',
        'agent__staff_user_profile__agent_code',
        'payment_reference'
    )
    
    readonly_fields = ('commission_amount', 'date_created', 'date_updated')
    
    fieldsets = (
        ('Agent & Sale', {
            'fields': ('agent', 'policy')
        }),
        ('Commission Details', {
            'fields': ('premium_amount', 'commission_rate', 'commission_amount')
        }),
        ('Payment Tracking', {
            'fields': ('payment_status', 'payment_date', 'payment_reference', 'notes')
        }),
        ('Timestamps', {
            'fields': ('date_created', 'date_updated'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_paid', 'mark_as_approved', 'mark_as_pending']
    
    def agent_display(self, obj):
        if hasattr(obj.agent, 'staff_user_profile') and obj.agent.staff_user_profile:
            return f"{obj.agent.staff_user_profile.full_names} ({obj.agent.staff_user_profile.agent_code})"
        return obj.agent.email or obj.agent.phonenumber
    agent_display.short_description = 'Agent'
    
    def sale_reference(self, obj):
        if obj.policy:
            return f"Policy: {obj.policy.policy_number}"
        return '-'
    sale_reference.short_description = 'Sale Reference'
    
    def mark_as_paid(self, request, queryset):
        updated = queryset.update(
            payment_status='PAID',
            payment_date=timezone.now().date()
        )
        self.message_user(request, f"{updated} commissions marked as paid.", level=messages.SUCCESS)
    mark_as_paid.short_description = "Mark as Paid"
    
    def mark_as_approved(self, request, queryset):
        updated = queryset.update(payment_status='APPROVED')
        self.message_user(request, f"{updated} commissions approved.", level=messages.SUCCESS)
    mark_as_approved.short_description = "Mark as Approved"
    
    def mark_as_pending(self, request, queryset):
        updated = queryset.update(payment_status='PENDING')
        self.message_user(request, f"{updated} commissions marked as pending.", level=messages.INFO)
    mark_as_pending.short_description = "Mark as Pending"
    
    def changelist_view(self, request, extra_context=None):
        try:
            settings_obj = CommissionSettings.get_solo()
            namespace = self.admin_site.name
            apply_url = reverse(f"{namespace}:app_commissionsettings_apply", args=[settings_obj.pk])
            self.message_user(
                request,
                format_html(
                    "Manage commission rate centrally in <a href='{}'>Commission settings</a>. Use the button there to apply the global rate to ALL commissions.",
                    reverse(f"{namespace}:app_commissionsettings_change", args=[settings_obj.pk])
                ),
                level=messages.INFO,
            )
            # Helper link to see all ACTIVE policies without commissions
            motor_list_url = f"{reverse('admin:app_motorpolicy_changelist')}?status=ACTIVE&has_commission=no"
            self.message_user(
                request,
                format_html(
                    "Can't see all policies here? <a href='{}'>Open Motor policies without commissions</a> and generate them in bulk from the actions menu.",
                    motor_list_url
                ),
                level=messages.SUCCESS,
            )
        except Exception:
            pass
        return super().changelist_view(request, extra_context=extra_context)

    # Removed "apply_global_commission_rate" action to simplify flow; use Commission Settings quick action instead.


# ============================================================================
# AGENT PERFORMANCE ADMIN
# ============================================================================

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
    
    readonly_fields = ('achievement_percentage', 'date_created', 'date_updated')
    
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
            'fields': ('date_created', 'date_updated'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['update_achievements']
    
    def agent_display(self, obj):
        if hasattr(obj.agent, 'staff_user_profile') and obj.agent.staff_user_profile:
            return f"{obj.agent.staff_user_profile.full_names} ({obj.agent.staff_user_profile.agent_code})"
        return obj.agent.email or obj.agent.phonenumber
    agent_display.short_description = 'Agent'
    
    def update_achievements(self, request, queryset):
        """Recalculate achievements from actual paid policy data."""
        for performance in queryset:
            performance.update_achievements()
        
        self.message_user(
            request, 
            f"Updated {queryset.count()} performance records from paid policy data.",
            level=messages.SUCCESS
        )
    update_achievements.short_description = "Update Achievements from Paid Policies"


@admin.register(MonthlyAgentBonus)
class MonthlyAgentBonusAdmin(admin.ModelAdmin):
    """Manage monthly agent bonuses (0.3% of total sales)."""
    
    list_display = (
        'agent_display',
        'period_display',
        'total_policies',
        'total_premium_display',
        'bonus_rate_display',
        'bonus_amount_display',
        'payment_status',
        'payment_date'
    )
    
    list_filter = (
        'payment_status',
        'year',
        'month',
        'payment_date'
    )
    
    search_fields = (
        'agent__email',
        'agent__phonenumber',
        'agent__staff_user_profile__agent_code',
        'agent__staff_user_profile__full_names',
        'period',
        'payment_reference'
    )
    
    readonly_fields = ('bonus_amount', 'period', 'date_created', 'date_updated')
    
    fieldsets = (
        ('Agent & Period', {
            'fields': ('agent', 'year', 'month', 'period')
        }),
        ('Sales Summary', {
            'fields': ('total_policies', 'total_premium'),
            'description': 'Auto-calculated when using "Recalculate from Sales" action'
        }),
        ('Bonus Calculation', {
            'fields': ('bonus_rate', 'bonus_amount'),
            'description': 'Bonus amount = (Total Premium × Bonus Rate) ÷ 100'
        }),
        ('Payment Tracking', {
            'fields': ('payment_status', 'payment_date', 'payment_reference', 'notes')
        }),
        ('Timestamps', {
            'fields': ('date_created', 'date_updated'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['recalculate_from_sales', 'mark_as_approved', 'mark_as_paid', 'generate_monthly_bonuses']
    
    def agent_display(self, obj):
        """Show agent name and code."""
        if hasattr(obj.agent, 'staff_user_profile') and obj.agent.staff_user_profile:
            profile = obj.agent.staff_user_profile
            return f"{profile.full_names} ({profile.agent_code})"
        return obj.agent.email or obj.agent.phonenumber
    agent_display.short_description = 'Agent'
    agent_display.admin_order_field = 'agent__staff_user_profile__full_names'
    
    def period_display(self, obj):
        """Show period in readable format."""
        from datetime import datetime
        try:
            date_obj = datetime(obj.year, obj.month, 1)
            return date_obj.strftime('%B %Y')  # e.g., "October 2025"
        except:
            return obj.period
    period_display.short_description = 'Period'
    period_display.admin_order_field = 'period'
    
    def total_premium_display(self, obj):
        """Format total premium with currency."""
        return format_html(
            '<strong>KSh {:,.2f}</strong>',
            obj.total_premium
        )
    total_premium_display.short_description = 'Total Premium'
    total_premium_display.admin_order_field = 'total_premium'
    
    def bonus_rate_display(self, obj):
        """Format bonus rate as percentage."""
        return f"{obj.bonus_rate}%"
    bonus_rate_display.short_description = 'Rate'
    bonus_rate_display.admin_order_field = 'bonus_rate'
    
    def bonus_amount_display(self, obj):
        """Format bonus amount with currency and highlight."""
        color = '#28a745' if obj.bonus_amount > 0 else '#6c757d'
        return format_html(
            '<strong style="color: {};">KSh {:,.2f}</strong>',
            color,
            obj.bonus_amount
        )
    bonus_amount_display.short_description = 'Bonus Amount'
    bonus_amount_display.admin_order_field = 'bonus_amount'
    
    def recalculate_from_sales(self, request, queryset):
        """Recalculate bonuses from actual ACTIVE policy sales in the period."""
        updated = 0
        for bonus in queryset:
            bonus.update_from_sales()
            updated += 1
        
        self.message_user(
            request,
            f"Recalculated {updated} bonus(es) from actual sales data.",
            level=messages.SUCCESS
        )
    recalculate_from_sales.short_description = "Recalculate from Sales Data"
    
    def mark_as_approved(self, request, queryset):
        """Mark selected bonuses as approved."""
        updated = queryset.update(payment_status='APPROVED')
        self.message_user(
            request,
            f"{updated} bonus(es) approved for payment.",
            level=messages.SUCCESS
        )
    mark_as_approved.short_description = "Mark as Approved"
    
    def mark_as_paid(self, request, queryset):
        """Mark selected bonuses as paid with today's date."""
        updated = queryset.update(
            payment_status='PAID',
            payment_date=timezone.now().date()
        )
        self.message_user(
            request,
            f"{updated} bonus(es) marked as paid.",
            level=messages.SUCCESS
        )
    mark_as_paid.short_description = "Mark as Paid"
    
    def generate_monthly_bonuses(self, request, queryset):
        """Generate bonus records for all agents for the selected periods."""
        from datetime import datetime
        import json
        
        # Get unique periods from selection
        periods = queryset.values_list('year', 'month').distinct()
        
        created = 0
        updated = 0
        
        # Get all agents
        agents = User.objects.filter(staff_user_profile__isnull=False)
        
        for year, month in periods:
            # Calculate date range
            start_date = datetime(year, month, 1).date()
            if month == 12:
                end_date = datetime(year + 1, 1, 1).date()
            else:
                end_date = datetime(year, month + 1, 1).date()
            
            period = f"{year}-{month:02d}"
            
            for agent in agents:
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
        
        if created > 0 or updated > 0:
            self.message_user(
                request,
                f"Generated bonuses: {created} new, {updated} updated.",
                level=messages.SUCCESS
            )
        else:
            self.message_user(
                request,
                "No bonuses generated. Ensure agents have ACTIVE policies in selected periods.",
                level=messages.WARNING
            )
    generate_monthly_bonuses.short_description = "Generate Bonuses for All Agents (Selected Periods)"



