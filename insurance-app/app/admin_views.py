from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import render
from django.db.models import Sum, Count, Avg
from django.utils import timezone
from django.http import JsonResponse
from datetime import timedelta

from .models import (
    User,
    InsuranceQuotation,
    MotorPricing,
    MotorCategory,
    MotorSubcategory,
    InsuranceProvider,
    DocumentUpload,
    ServiceProcessingLog,
    # ExtendiblePricing, PolicyExtension removed - using InsuranceProvider.features.pricing
    Campaign,
    ManualQuote,
)


@staff_member_required
def admin_dashboard(request):
    today = timezone.now().date()
    last_30 = today - timedelta(days=30)

    total_users = User.objects.count()
    total_agents = User.objects.filter(role='AGENT').count()
    total_customers = User.objects.filter(role='CUSTOMER').count()
    new_users_30d = User.objects.filter(date_created__date__gte=last_30).count()

    total_quotations = InsuranceQuotation.objects.count()
    pending_quotations = InsuranceQuotation.objects.filter(status='PENDING').count()
    approved_quotations = InsuranceQuotation.objects.filter(status='APPROVED').count()
    converted_quotations = InsuranceQuotation.objects.filter(status='CONVERTED').count()

    total_pricing_rules = MotorPricing.objects.filter(is_active=True).count()
    active_underwriters = InsuranceProvider.objects.filter(is_active=True).count()
    total_categories = MotorCategory.objects.filter(is_active=True).count()
    total_subcategories = MotorSubcategory.objects.filter(is_active=True).count()
    extendible_products = MotorSubcategory.objects.filter(is_extendible=True).count()

    pending_extensions = 0  # Legacy PolicyExtension table removed
    grace_period_policies = 0  # Legacy PolicyExtension table removed

    active_campaigns = Campaign.objects.filter(status='ACTIVE').count()
    scheduled_campaigns = Campaign.objects.filter(status='SCHEDULED').count()
    total_campaign_impressions = Campaign.objects.aggregate(total=Sum('total_impressions'))['total'] or 0
    total_campaign_clicks = Campaign.objects.aggregate(total=Sum('total_clicks'))['total'] or 0

    total_premium_amount = InsuranceQuotation.objects.aggregate(total=Sum('total_premium'))['total'] or 0

    context = {
        'total_users': total_users,
        'total_agents': total_agents,
        'total_customers': total_customers,
        'new_users_30d': new_users_30d,
        'total_quotations': total_quotations,
        'pending_quotations': pending_quotations,
        'approved_quotations': approved_quotations,
        'converted_quotations': converted_quotations,
        'total_pricing_rules': total_pricing_rules,
        'active_underwriters': active_underwriters,
        'total_categories': total_categories,
        'total_subcategories': total_subcategories,
        'extendible_products': extendible_products,
        'pending_extensions': pending_extensions,
        'grace_period_policies': grace_period_policies,
        'active_campaigns': active_campaigns,
        'scheduled_campaigns': scheduled_campaigns,
        'total_campaign_impressions': total_campaign_impressions,
        'total_campaign_clicks': total_campaign_clicks,
        'total_premium_amount': total_premium_amount,
    }
    return render(request, 'admin/dashboard/main_dashboard.html', context)


@staff_member_required
def pricing_analytics(request):
    pricing_by_underwriter = (
        MotorPricing.objects.filter(is_active=True)
        .values('underwriter__name')
        .annotate(count=Count('id'), avg_premium=Avg('base_premium'))
        .order_by('-count')[:20]
    )
    category_distribution = (
        MotorSubcategory.objects
        .values('category__category_name')
        .annotate(count=Count('id'))
        .order_by('-count')
    )
    recent_updates = (
        MotorPricing.objects.filter(is_active=True)
        .select_related('underwriter', 'subcategory')
        .order_by('-date_updated')[:10]
    )
    extendible_analytics = {
        'total_extendible': MotorSubcategory.objects.filter(is_extendible=True).count(),
        'extendible_pricing_rules': 0,  # Removed ExtendiblePricing table
        'pending_extensions': 0,  # Removed PolicyExtension table
        'successful_extensions': 0,  # Removed PolicyExtension table
    }
    context = {
        'pricing_by_underwriter': list(pricing_by_underwriter),
        'category_distribution': list(category_distribution),
        'recent_updates': recent_updates,
        'extendible_analytics': extendible_analytics,
    }
    return render(request, 'admin/dashboard/pricing_analytics.html', context)


@staff_member_required
def quotation_analytics(request):
    status_counts = InsuranceQuotation.objects.values('status').annotate(count=Count('id')).order_by('-count')
    # Agent performance top 10
    agent_perf = (
        InsuranceQuotation.objects.values('agent__phonenumber')
        .annotate(total_quotations=Count('id'), total_premium=Sum('total_premium'))
        .order_by('-total_quotations')[:10]
    )
    insurance_type_dist = (
        InsuranceQuotation.objects.values('insurance_type')
        .annotate(count=Count('id'), total_premium=Sum('total_premium'))
        .order_by('-count')
    )
    context = {
        'status_counts': list(status_counts),
        'agent_performance': list(agent_perf),
        'insurance_type_dist': list(insurance_type_dist),
    }
    return render(request, 'admin/dashboard/quotation_analytics.html', context)


@staff_member_required
def system_health(request):
    last_7d = timezone.now() - timedelta(days=7)
    db_stats = {
        'total_users': User.objects.count(),
        'total_quotations': InsuranceQuotation.objects.count(),
        'total_documents': DocumentUpload.objects.count(),
        'recent_logins': User.objects.filter(last_login__gte=last_7d).count() if hasattr(User, 'last_login') else 0,
    }
    api_health = {
        'total_api_calls': ServiceProcessingLog.objects.count(),
        'successful_calls': ServiceProcessingLog.objects.filter(success=True).count(),
        'failed_calls': ServiceProcessingLog.objects.filter(success=False).count(),
        'recent_errors': ServiceProcessingLog.objects.filter(success=False, date_created__gte=timezone.now()-timedelta(hours=24)).count(),
    }
    doc_health = {
        'processed_documents': DocumentUpload.objects.filter(processing_status='PROCESSED').count(),
        'failed_documents': DocumentUpload.objects.filter(processing_status='FAILED').count(),
        'pending_documents': DocumentUpload.objects.exclude(processing_status__in=['PROCESSED','FAILED']).count(),
    }
    context = {'db_stats': db_stats, 'api_health': api_health, 'doc_health': doc_health}
    return render(request, 'admin/dashboard/system_health.html', context)


@staff_member_required
def dashboard_api(request):
    data_type = request.GET.get('type', 'overview')
    if data_type == 'charts':
        today = timezone.now().date()
        days = [today - timedelta(days=i) for i in range(13, -1, -1)]
        labels = [d.strftime('%b %d') for d in days]
        values = []
        for d in days:
            cnt = InsuranceQuotation.objects.filter(date_created__date=d).count()
            values.append(cnt)

        type_counts = (
            InsuranceQuotation.objects.values('insurance_type').annotate(count=Count('id')).order_by('-count')
        )
        pie_labels = [row['insurance_type'] for row in type_counts]
        pie_values = [row['count'] for row in type_counts]

        data = {
            'quotation_trends': {'labels': labels, 'values': values},
            'insurance_type_pie': {'labels': pie_labels, 'values': pie_values},
        }
    else:
        data = {
            'totals': {
                'users': User.objects.count(),
                'quotations': InsuranceQuotation.objects.count(),
                'campaigns': Campaign.objects.filter(status='ACTIVE').count(),
            }
        }
    return JsonResponse(data)


@staff_member_required
def help_page(request):
    context = {}
    return render(request, 'admin/help.html', context)


@staff_member_required
def badges_api(request):
    """Lightweight counts endpoint for admin sidebar badges.

    Returns JSON like:
    {
      "manual_quotes": {"pending": 3, "in_progress": 2, "completed": 10, "rejected": 1, "total_pending": 5},
      "quotations": {"pending": 4},
      "documents": {"pending": 2},
      "extensions": {"pending": 1, "grace_period": 0},
      "all_pending": 12
    }
    """
    # Manual quotes breakdown
    mq_pending = ManualQuote.objects.filter(status='PENDING_ADMIN_REVIEW').count()
    mq_in_progress = ManualQuote.objects.filter(status='IN_PROGRESS').count()
    mq_completed = ManualQuote.objects.filter(status='COMPLETED').count()
    mq_rejected = ManualQuote.objects.filter(status='REJECTED').count()
    mq_total_pending = mq_pending + mq_in_progress

    # Insurance quotations pending
    quo_pending = InsuranceQuotation.objects.filter(status='PENDING').count()

    # Documents pending processing (anything not PROCESSED/FAILED)
    doc_pending = DocumentUpload.objects.exclude(processing_status__in=['PROCESSED', 'FAILED']).count()

    # Policy extensions (legacy table removed)
    ext_pending = 0
    ext_grace = 0

    data = {
        'manual_quotes': {
            'pending': mq_pending,
            'in_progress': mq_in_progress,
            'completed': mq_completed,
            'rejected': mq_rejected,
            'total_pending': mq_total_pending,
        },
        'quotations': {
            'pending': quo_pending,
        },
        'documents': {
            'pending': doc_pending,
        },
        'extensions': {
            'pending': ext_pending,
            'grace_period': ext_grace,
        },
        'all_pending': mq_total_pending + quo_pending + doc_pending + ext_pending + ext_grace,
    }
    return JsonResponse(data)