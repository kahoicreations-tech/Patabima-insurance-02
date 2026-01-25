from django.urls import path
from .views import (
    motor_flow,
    policy_management
)
from .views.motor2_metadata_views import Motor2MetadataView

urlpatterns = [
    # Motor2 Metadata API endpoint (for static data version management)
    path('motor2/metadata/version/', Motor2MetadataView.as_view(), name='motor2_metadata_version'),
    
    # Motor2 Flow API endpoints (NEW - frontend uses motor2)
    path('motor2/categories/', motor_flow.get_motor_categories, name='get_motor2_categories'),
    path('motor2/subcategories/', motor_flow.get_subcategories, name='get_motor2_subcategories'),
    # get_field_requirements expects ?category=&subcategory= in query params
    path('motor2/field-requirements/', motor_flow.get_field_requirements, name='get_motor2_field_requirements'),
    
    # Legacy Motor Flow API endpoints (DEPRECATED - keeping for backwards compatibility)
    path('motor/categories/', motor_flow.get_motor_categories, name='get_motor_categories'),
    path('motor/subcategories/', motor_flow.get_subcategories, name='get_subcategories'),
    # get_field_requirements expects ?category=&subcategory= in query params
    path('motor/field-requirements/', motor_flow.get_field_requirements, name='get_field_requirements'),
    # Underwriters and pricing endpoints
    path('public_app/insurance/get_underwriters', motor_flow.get_underwriters, name='get_underwriters_noslash'),
    path('public_app/insurance/get_underwriters/', motor_flow.get_underwriters, name='get_underwriters'),
    path('public_app/insurance/calculate_motor_premium', motor_flow.calculate_premium, name='calculate_motor_premium_noslash'),
    path('public_app/insurance/calculate_motor_premium/', motor_flow.calculate_premium, name='calculate_motor_premium'),
    path('public_app/insurance/compare_motor_pricing', motor_flow.compare_pricing, name='compare_motor_pricing_noslash'),
    path('public_app/insurance/compare_motor_pricing/', motor_flow.compare_pricing, name='compare_motor_pricing'),
    # Add-ons listing (public) with optional underwriter overrides
    path('public_app/insurance/addons', motor_flow.get_addons, name='get_addons_noslash'),
    path('public_app/insurance/addons/', motor_flow.get_addons, name='get_addons'),
    
    # Policy Management API endpoints
    path('policies/create-quote/', policy_management.create_policy_quote, name='create_policy_quote'),
    path('policies/finalize/<str:quote_id>/', policy_management.finalize_policy, name='finalize_policy'),
    path('policies/receipt/<str:policy_id>/', policy_management.generate_receipt, name='generate_receipt'),

    # Motor policy activation (app-driven)
    path('policies/motor/<str:policy_number>/activate/', policy_management.activate_motor_policy, name='activate_motor_policy'),

    # Motor policy document proxy downloads (authenticated)
    path('policies/motor/<str:policy_number>/documents/policy-pdf/', policy_management.proxy_download_policy_pdf, name='proxy_download_policy_pdf'),
    path('policies/motor/<str:policy_number>/documents/receipt-pdf/', policy_management.proxy_download_receipt_pdf, name='proxy_download_receipt_pdf'),
    path('policies/motor/<str:policy_number>/documents/dmvic-certificate-pdf/', policy_management.proxy_download_dmvic_certificate_pdf, name='proxy_download_dmvic_certificate_pdf'),
    
    # DMVIC Certificate Management Endpoints (Intermediary Integration)
    path('policies/motor/<str:policy_number>/certificate/preview/', policy_management.get_certificate_preview, name='get_certificate_preview'),
    path('policies/motor/<str:policy_number>/certificate/issue/', policy_management.issue_certificate, name='issue_certificate'),
    path('policies/motor/<str:policy_number>/certificate/status/', policy_management.get_certificate_status, name='get_certificate_status'),
    
    # Motor 2 Renewal & Extension listing endpoints (must be BEFORE dynamic <policy_number> route)
    # (Ordering fix) static paths placed first to avoid being captured by the generic policy detail pattern.
    path('policies/motor/upcoming-renewals/', policy_management.get_upcoming_renewals, name='get_upcoming_renewals'),
    path('policies/motor/upcoming-extensions/', policy_management.get_upcoming_extensions, name='get_upcoming_extensions'),

    # Motor 2 Policy Creation & Listing Endpoints
    path('policies/motor/create/', policy_management.create_motor_policy, name='create_motor_policy'),
    path('policies/motor/', policy_management.list_motor_policies, name='list_motor_policies'),

    # Motor 2 Policy specific operations (dynamic segment comes after static endpoints)
    path('policies/motor/<str:policy_number>/', policy_management.get_motor_policy, name='get_motor_policy'),
    
    # Motor 2 Payment Actions
    path('policies/motor/<str:policy_number>/retry-payment/', policy_management.retry_policy_payment, name='retry_policy_payment'),
    
    # Motor 2 Renewal Actions
    path('policies/motor/<str:policy_number>/renewal-eligibility/', policy_management.check_renewal_eligibility, name='check_renewal_eligibility'),
    path('policies/motor/<str:policy_number>/renew/', policy_management.renew_motor_policy, name='renew_motor_policy'),
    
    # Motor 2 Extension Actions
    path('policies/motor/<str:policy_number>/extension-eligibility/', policy_management.check_extension_eligibility, name='check_extension_eligibility'),
    path('policies/motor/<str:policy_number>/extend/', policy_management.extend_motor_policy, name='extend_motor_policy'),

    # Public quotation endpoints (frontend probes under public_app)
    path('public_app/insurance/submit_motor_quotation', policy_management.submit_motor_quotation, name='submit_motor_quotation_noslash'),
    path('public_app/insurance/submit_motor_quotation/', policy_management.submit_motor_quotation, name='submit_motor_quotation'),
    path('public_app/insurance/get_quotations', policy_management.get_public_quotations, name='get_public_quotations_noslash'),
    path('public_app/insurance/get_quotations/', policy_management.get_public_quotations, name='get_public_quotations'),
]