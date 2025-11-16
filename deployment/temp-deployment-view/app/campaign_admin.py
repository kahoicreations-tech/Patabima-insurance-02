from django.contrib import admin, messages
from django import forms
from django.utils.html import format_html
from django.urls import path
from django.shortcuts import render, get_object_or_404, redirect
from django.utils import timezone
from django.http import JsonResponse
from django.db.models import Sum
from .models import Campaign, CampaignInteraction, CampaignSchedule
from .utils.image_validation import validate_banner_image_file
"""Admin configuration for Campaigns with banner preview only (no auto-resize)."""


class AdminImagePreviewWidget(forms.ClearableFileInput):
    
    def render(self, name, value, attrs=None, renderer=None):
        # Render default file input without any inline preview script
        return super().render(name, value, attrs, renderer)


class CampaignSimpleForm(forms.ModelForm):
    """Minimal admin form exposing only essential fields (no auto-resize)."""
    class Meta:
        model = Campaign
        fields = [
            'name', 'status', 'target_roles',
            'banner_image', 'image_url',
            'start_date', 'end_date'
        ]
        widgets = {
            'banner_image': AdminImagePreviewWidget,
        }

    def clean(self):
        cleaned = super().clean()
        start = cleaned.get('start_date')
        end = cleaned.get('end_date')
        if start and end and end < start:
            self.add_error('end_date', 'End date must be after start date')
        # Require either uploaded image or image_url
        image_url = cleaned.get('image_url')
        banner_image = cleaned.get('banner_image')
        if not banner_image and not image_url:
            self.add_error('image_url', 'Provide a banner by uploading an image or entering an Image URL')
        # Validate uploaded image dimensions/format/size for HomeScreen
        if banner_image:
            try:
                validate_banner_image_file(banner_image)
            except ValueError as e:
                # No auto-fix; ask admin to use an external image resizer
                self.add_error('banner_image', f"{e} Please resize/crop to ~16:9 (1200x675) using an online image resizer, then re-upload.")
        return cleaned


@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    form = CampaignSimpleForm
    # Hide advanced/rarely used fields to keep admin simple
    exclude = (
        'description', 'campaign_type', 'target_regions', 'target_age_min', 'target_age_max',
        'budget', 'target_impressions', 'target_clicks', 'target_conversions',
        'total_impressions', 'total_clicks', 'total_conversions', 'total_spent',
        'created_by', 'title', 'message', 'call_to_action', 'action_url',
    )
    list_display = (
        'name', 'status', 'target_roles',
        'start_date', 'end_date', 'created_by', 'is_active'
    )
    list_filter = ('status', 'target_roles', 'start_date', 'is_active')
    search_fields = ('name', 'title', 'description')
    date_hierarchy = 'start_date'
    readonly_fields = (
        'date_created', 'date_updated', 'image_preview'
    )
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'status', 'target_roles')
        }),
        ('Content', {
            'fields': ('banner_image', 'image_url', 'image_preview'),
            'description': 'Upload a banner image or provide an Image URL. Recommended size ~16:9 (e.g. 1200x675). Use an online resizer/crop tool if needed.'
        }),
        ('Schedule', {
            'fields': ('start_date', 'end_date')
        }),
        ('Timestamps', {
            'fields': ('date_created', 'date_updated')
        }),
    )
    actions = ['activate_campaigns', 'pause_campaigns', 'clone_campaigns']

    def image_preview(self, obj):
        # Prefer uploaded image if present; fallback to image_url
        if obj and getattr(obj, 'banner_image', None):
            try:
                return format_html(
                    '<div style="display:flex;align-items:center;gap:12px;">'
                    '<img src="{}" style="max-width:480px; height:auto; border-radius:6px; box-shadow:0 2px 8px rgba(0,0,0,0.1);"/>'
                    '<div style="color:#666;font-size:12px;">Preview</div>'
                    '</div>',
                    obj.banner_image.url
                )
            except Exception:
                pass
        if obj and getattr(obj, 'image_url', None):
            return format_html('<div style="display:flex;align-items:center;gap:12px;">'
                               '<img src="{}" style="max-width:480px; height:auto; border-radius:6px; box-shadow:0 2px 8px rgba(0,0,0,0.1);"/>'
                               '<div style="color:#666;font-size:12px;">Remote image preview</div>'
                               '</div>', obj.image_url)
        return format_html('<span style="color:#999;">No image. Upload a banner or provide an Image URL.</span>')
    image_preview.short_description = 'Banner Preview'

    def status_display(self, obj):
        colors = {
            'DRAFT': '#6c757d',
            'SCHEDULED': '#0dcaf0',
            'ACTIVE': '#198754',
            'PAUSED': '#ffc107',
            'COMPLETED': '#0d6efd',
            'CANCELLED': '#dc3545',
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html('<span style="color:{}; font-weight:600;">{}</span>', color, obj.status)
    status_display.short_description = 'Status'

    def performance_summary(self, obj):
        if obj.total_impressions:
            ctr = (obj.total_clicks / obj.total_impressions) * 100 if obj.total_impressions else 0
            return format_html('Imp: {} | Clicks: {} | CTR: {:.1f}%', obj.total_impressions, obj.total_clicks, ctr)
        return format_html('<span style="color:#999;">No data yet</span>')
    performance_summary.short_description = 'Performance'

    def get_urls(self):
        urls = super().get_urls()
        custom = [
            path('<path:campaign_id>/preview/', self.admin_site.admin_view(self.preview_campaign), name='campaign-preview'),
            path('<path:campaign_id>/analytics/', self.admin_site.admin_view(self.campaign_analytics), name='campaign-analytics'),
            path('dashboard/', self.admin_site.admin_view(self.performance_dashboard), name='campaign-dashboard'),
        ]
        return custom + urls

    def preview_campaign(self, request, campaign_id):
        campaign = get_object_or_404(Campaign, id=campaign_id)
        context = {'campaign': campaign}
        return render(request, 'admin/campaign/preview.html', context)

    def campaign_analytics(self, request, campaign_id):
        campaign = get_object_or_404(Campaign, id=campaign_id)
        totals = CampaignInteraction.objects.filter(campaign=campaign).values('interaction_type').annotate(total=Sum(1))
        context = {'campaign': campaign, 'totals': list(totals)}
        return render(request, 'admin/campaign/analytics.html', context)

    def performance_dashboard(self, request):
        metrics = Campaign.objects.aggregate(
            total_impressions=Sum('total_impressions')
        )
        context = {'metrics': metrics, 'campaigns': Campaign.objects.order_by('-start_date')[:20]}
        return render(request, 'admin/campaign/dashboard.html', context)

    def activate_campaigns(self, request, queryset):
        updated = queryset.exclude(status='ACTIVE').update(status='ACTIVE')
        self.message_user(request, f"Activated {updated} campaigns", level=messages.SUCCESS)
    activate_campaigns.short_description = 'Activate selected campaigns'

    def pause_campaigns(self, request, queryset):
        updated = queryset.filter(status='ACTIVE').update(status='PAUSED')
        self.message_user(request, f"Paused {updated} campaigns", level=messages.INFO)
    pause_campaigns.short_description = 'Pause selected campaigns'

    def clone_campaigns(self, request, queryset):
        cloned = 0
        for c in queryset:
            c.pk = None
            c.name = f"{c.name} (Copy)"
            c.status = 'DRAFT'
            c.total_impressions = 0
            c.total_clicks = 0
            c.total_conversions = 0
            c.total_spent = 0
            c.save()
            cloned += 1
        self.message_user(request, f"Cloned {cloned} campaigns", level=messages.SUCCESS)
    clone_campaigns.short_description = 'Clone selected campaigns'

    def save_model(self, request, obj, form, change):
        # Auto-assign created_by for new campaigns
        if not change and not obj.created_by_id:
            obj.created_by = request.user
        # Ensure safe defaults for simplified admin fields not shown in the form
        # Description may be NOT NULL in existing DBs
        if obj.description is None:
            obj.description = ''
        # Campaign type default for simplified admin
        if not getattr(obj, 'campaign_type', None):
            obj.campaign_type = 'PROMOTIONAL'
        # Optional overlay fields used by legacy clients; keep non-null by default
        obj.title = obj.title or ''
        obj.message = obj.message or ''
        obj.call_to_action = obj.call_to_action or ''
        super().save_model(request, obj, form, change)


# CampaignInteraction admin removed - interactions tracked but not exposed in admin UI


@admin.register(CampaignSchedule)
class CampaignScheduleAdmin(admin.ModelAdmin):
    list_display = ('campaign', 'frequency', 'time_of_day', 'next_send', 'is_active')
    list_filter = ('frequency', 'is_active', 'timezone')
    search_fields = ('campaign__name',)
    ordering = ['next_send']
    readonly_fields = ('last_sent', 'next_send', 'date_created', 'date_updated')
