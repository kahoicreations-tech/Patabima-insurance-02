from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import render
from django.http import HttpResponse
import csv

from .models import User, InsuranceQuotation, MotorSubcategory, InsuranceProvider


@staff_member_required
def business_intelligence(request):
    context = {}
    return render(request, 'admin/reports/business_intelligence.html', context)


@staff_member_required
def export_agent_report(request):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="agent_performance_report.csv"'
    writer = csv.writer(response)
    writer.writerow(['Agent Phone', 'Role', 'Total Quotations'])
    agents = User.objects.filter(role='AGENT').values_list('phonenumber', 'role')
    for phone, role in agents:
        total_q = InsuranceQuotation.objects.filter(agent__phonenumber=phone).count()
        writer.writerow([phone, role, total_q])
    return response


@staff_member_required
def pricing_comparison_report(request):
    context = {'subcategories': MotorSubcategory.objects.filter(is_active=True)[:10], 'underwriters': InsuranceProvider.objects.filter(is_active=True)[:10]}
    return render(request, 'admin/reports/pricing_comparison.html', context)