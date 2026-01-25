from django.urls import path, include
from rest_framework import routers
from rest_framework_simplejwt.views import TokenRefreshView

# Import auth-related viewsets from a dedicated module to avoid collisions
from .auth_views import LoginViewSet, UserViewset
from .commissions_views import CommissionsViewset
from .views_docs import PresignUploadView, SubmitExtractionView, JobStatusView, JobResultView, CallbackView, ApplyResultView
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
from .views import PaymentsViewSet
from .views import NotificationsViewSet
# Import DMVIC integration views
from .views.dmvic_integrations import (
    verify_vehicle_with_dmvic,
    get_dmvic_certificate,
    download_dmvic_certificate
)
# Import new DMVIC REST API views
from .views import dmvic_views
# Import OTP views
from .views.otp_views import OTPViewSet
# Import Motor3 quotation views
from .views import motor3_quotations
# Import email verification views
from .views.email_verification_views import (
    send_email_verification,
    verify_email_code,
    resend_email_verification
)

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
router.register('payments', PaymentsViewSet, basename='payments')
router.register('notifications', NotificationsViewSet, basename='notifications')

urlpatterns = [
	# Document processing endpoints (public_app scope)
    path('docs/presign', PresignUploadView.as_view()),
    path('docs/submit', SubmitExtractionView.as_view()),
    path('docs/status/<uuid:job_id>', JobStatusView.as_view()),
    path('docs/result/<uuid:job_id>', JobResultView.as_view()),
	path('docs/apply/<uuid:job_id>', ApplyResultView.as_view()),
	path('docs/callback', CallbackView.as_view()),
    # Claims endpoints
    path('claims/presign', ClaimsPresignView.as_view()),
    path('claims/submit', ClaimsSubmitView.as_view()),
    path('claims', ClaimsListView.as_view()),
    path('claims/<uuid:claim_id>', ClaimsDetailView.as_view()),
    # Auth token refresh endpoint for mobile client
    path('auth/token/refresh', TokenRefreshView.as_view()),
    # OTP endpoints (under /api/auth/otp/)
    path('auth/otp/send', OTPViewSet.as_view({'post': 'send'}), name='otp-send'),
    path('auth/otp/verify', OTPViewSet.as_view({'post': 'verify'}), name='otp-verify'),
    path('auth/otp/resend', OTPViewSet.as_view({'post': 'resend'}), name='otp-resend'),
    # Email verification endpoints (under /api/auth/email/)
    path('auth/email/send-verification/', send_email_verification, name='send-email-verification'),
    path('auth/email/verify-code/', verify_email_code, name='verify-email-code'),
    path('auth/email/resend-verification/', resend_email_verification, name='resend-email-verification'),
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
    
    # Motor3 Quotation endpoints
    path('motor3/quotations/third-party/', motor3_quotations.create_motor3_third_party_quotation, name='motor3-quotation-third-party'),
    path('motor3/quotations/comprehensive/', motor3_quotations.create_motor3_comprehensive_quotation, name='motor3-quotation-comprehensive'),
    path('motor3/quotations/tor/', motor3_quotations.create_motor3_tor_quotation, name='motor3-quotation-tor'),
    path('motor3/quotations/', motor3_quotations.list_motor3_quotations, name='motor3-quotations-list'),
    path('motor3/quotations/<uuid:quotation_id>/', motor3_quotations.get_motor3_quotation, name='motor3-quotation-detail'),
    path('motor3/quotations/<uuid:quotation_id>/pdf/', motor3_quotations.get_motor3_quotation_pdf, name='motor3-quotation-pdf'),
    path('motor3/quotations/<uuid:quotation_id>/convert/', motor3_quotations.convert_motor3_quotation_to_policy, name='motor3-quotation-convert'),
]

urlpatterns += router.urls
