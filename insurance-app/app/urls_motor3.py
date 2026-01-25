from django.urls import path
from app.views import motor3_quotations

urlpatterns = [
    path('quotations/third-party/', motor3_quotations.create_motor3_third_party_quotation, name='motor3_create_third_party_quotation'),
    path('quotations/comprehensive/', motor3_quotations.create_motor3_comprehensive_quotation, name='motor3_create_comprehensive_quotation'),
    path('quotations/', motor3_quotations.list_motor3_quotations, name='motor3_list_quotations'),
    path('quotations/<uuid:quotation_id>/', motor3_quotations.get_motor3_quotation, name='motor3_get_quotation'),
    path('quotations/<uuid:quotation_id>/pdf/', motor3_quotations.get_motor3_quotation_pdf, name='motor3_get_quotation_pdf'),
    path('quotations/<uuid:quotation_id>/convert/', motor3_quotations.convert_motor3_quotation_to_policy, name='motor3_convert_quotation_to_policy'),
]
