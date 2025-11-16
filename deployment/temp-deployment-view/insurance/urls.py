"""insurance URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import RedirectView
from app.health_views import health
from app import admin_views, reporting_views
from django.conf import settings
from django.conf.urls.static import static

api_version = 'api/v1/'

urlpatterns = [
    # Root URL - redirect to health check or API docs
    path('', RedirectView.as_view(url='/api/v1/health/', permanent=False), name='root'),
    # Legacy redirects: remove 404s for any leftover /pba-admin/* calls
    re_path(r'^pba-admin/(?P<rest>.*)$', RedirectView.as_view(url='/admin/%(rest)s', permanent=True)),
    # Consolidated custom admin views under the default Django admin
    path('admin/dashboard/', admin_views.admin_dashboard, name='admin-dashboard'),
    path('admin/pricing-analytics/', admin_views.pricing_analytics, name='admin-pricing-analytics'),
    path('admin/quotation-analytics/', admin_views.quotation_analytics, name='admin-quotation-analytics'),
    path('admin/system-health/', admin_views.system_health, name='admin-system-health'),
    path('admin/dashboard-api/', admin_views.dashboard_api, name='admin-dashboard-api'),
    path('admin/badges-api/', admin_views.badges_api, name='admin-badges-api'),
    path('admin/help/', admin_views.help_page, name='admin-help'),
    path('admin/reports/bi/', reporting_views.business_intelligence, name='admin-reports-bi'),
    path('admin/reports/agents.csv', reporting_views.export_agent_report, name='admin-reports-agents'),
    path('admin/reports/pricing/', reporting_views.pricing_comparison_report, name='admin-reports-pricing'),

    # Default admin site
    path('admin/', admin.site.urls),

    path(api_version + 'public_app/', include('app.urls')),
    path('api/insurance/', include('app.urls')),
    # Motor endpoints (v1 legacy)
    path('api/v1/', include('app.urls_motor')),
    # Simple health check endpoint for deployment readiness
    path('api/v1/health/', health, name='health'),
]
# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
