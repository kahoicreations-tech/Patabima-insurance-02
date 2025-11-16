from django.urls import path
from .views import (
    motor_flow,
    vehicle_validation,
    document_upload,
    payment_gateway,
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
    
    # Vehicle Validation API endpoints
    path('vehicle/validate-registration/', vehicle_validation.validate_vehicle_registration, name='validate_vehicle_registration'),
    path('vehicle/validate-chassis/', vehicle_validation.validate_vehicle_chassis, name='validate_vehicle_chassis'),
    
    # Document Upload API endpoints
    path('documents/upload-kyc/', document_upload.upload_kyc_document, name='upload_kyc_document'),
    path('documents/ocr-process/', document_upload.simulate_ocr_processing, name='simulate_ocr_processing'),
    path('documents/status/<str:document_id>/', document_upload.get_document_status, name='get_document_status'),
    
    # Payment Gateway API endpoints
    path('payments/mpesa/initiate/', payment_gateway.initiate_mpesa_payment, name='initiate_mpesa_payment'),
    path('payments/mpesa/status/<str:checkout_request_id>/', payment_gateway.check_mpesa_payment_status, name='check_mpesa_payment_status'),
    path('payments/dpo/initiate/', payment_gateway.initiate_dpo_payment, name='initiate_dpo_payment'),
    path('payments/callback/', payment_gateway.process_payment_callback, name='process_payment_callback'),
    
    # Policy Management API endpoints
    path('policies/create-quote/', policy_management.create_policy_quote, name='create_policy_quote'),
    path('policies/finalize/<str:quote_id>/', policy_management.finalize_policy, name='finalize_policy'),
    path('policies/receipt/<str:policy_id>/', policy_management.generate_receipt, name='generate_receipt'),
    
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