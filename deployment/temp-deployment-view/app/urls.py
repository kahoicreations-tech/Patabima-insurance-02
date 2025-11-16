from django.urls import path, include
from rest_framework import routers
from rest_framework_simplejwt.views import TokenRefreshView

# Import auth-related viewsets from a dedicated module to avoid collisions
from .auth_views import LoginViewSet, UserViewset
from .commissions_views import CommissionsViewset
from .views_docs import PresignUploadView, SubmitExtractionView, JobStatusView, JobResultView, CallbackView, ApplyResultView
from .views.hybrid_document_views import generate_presigned_url, submit_extraction_job, get_job_status, get_job_result
from .views.claims import (
	ClaimsPresignView,
	ClaimsSubmitView,
	ClaimsListView,
	ClaimsDetailView,
)
from .manual_quote_views import AgentManualQuoteViewSet, AdminManualQuoteViewSet
from .campaign_views import PublicCampaignViewSet, AdminCampaignViewSet
# Import IntegrationsViewSet for DMVIC vehicle check
from .views import IntegrationsViewSet
# Import DMVIC integration views
from .views.dmvic_integrations import (
    verify_vehicle_with_dmvic,
    get_dmvic_certificate,
    download_dmvic_certificate
)
# Import new DMVIC REST API views
from .views import dmvic_views

router = routers.DefaultRouter(trailing_slash=False)

router.register('auth', LoginViewSet, basename='auth')
router.register('user', UserViewset, basename='user')
router.register('commissions', CommissionsViewset, basename='commissions')
# Register manual quote endpoints
router.register('manual_quotes', AgentManualQuoteViewSet, basename='manual-quotes')
router.register('admin/manual_quotes', AdminManualQuoteViewSet, basename='admin-manual-quotes')
# Register campaign endpoints
router.register('campaigns', PublicCampaignViewSet, basename='campaign')
router.register('admin/campaigns', AdminCampaignViewSet, basename='admin-campaign')
# Register integrations endpoints (DMVIC vehicle check, etc.)
router.register('integrations', IntegrationsViewSet, basename='integrations')

urlpatterns = [
	# Document processing endpoints (public_app scope)
	path('docs/presign', generate_presigned_url),
	path('docs/submit', submit_extraction_job),
	path('docs/status/<uuid:job_id>', get_job_status),
	path('docs/result/<uuid:job_id>', get_job_result),
	path('docs/apply/<uuid:job_id>', ApplyResultView.as_view()),
	path('docs/callback', CallbackView.as_view()),
    # Claims endpoints
    path('claims/presign', ClaimsPresignView.as_view()),
    path('claims/submit', ClaimsSubmitView.as_view()),
    path('claims', ClaimsListView.as_view()),
    path('claims/<uuid:claim_id>', ClaimsDetailView.as_view()),
    # Auth token refresh endpoint for mobile client
    path('auth/token/refresh', TokenRefreshView.as_view()),
    # DMVIC Integration endpoints (Legacy)
    path('integrations/vehicle_check', verify_vehicle_with_dmvic, name='dmvic-vehicle-check'),
    path('integrations/certificates/<str:policy_number>', get_dmvic_certificate, name='dmvic-get-certificate'),
    path('integrations/certificates/<str:certificate_number>/download', download_dmvic_certificate, name='dmvic-download-certificate'),
    
    # DMVIC REST API endpoints (New - Recommended)
    path('dmvic/search-vehicle/', dmvic_views.search_vehicle, name='dmvic_search_vehicle'),
    path('dmvic/validate-double-insurance/', dmvic_views.validate_double_insurance, name='dmvic_validate_double_insurance'),
    path('dmvic/preview-certificate/', dmvic_views.preview_certificate, name='dmvic_preview_certificate'),
    path('dmvic/issue-certificate/', dmvic_views.issue_certificate, name='dmvic_issue_certificate'),
    path('dmvic/confirm-issuance/', dmvic_views.confirm_certificate_issuance, name='dmvic_confirm_issuance'),
    path('dmvic/get-certificate-pdf/', dmvic_views.get_certificate_pdf, name='dmvic_get_certificate_pdf'),
    path('dmvic/health-check/', dmvic_views.dmvic_health_check, name='dmvic_health_check'),
]

urlpatterns += router.urls
