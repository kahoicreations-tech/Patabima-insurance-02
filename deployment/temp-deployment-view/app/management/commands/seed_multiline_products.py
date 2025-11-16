"""Management command: seed initial multi-line insurance data (Medical, Travel, Last Expense)."""
from django.core.management.base import BaseCommand
from app import models

MEDICAL_FORM_SCHEMA = {
    "version": 1,
    "sections": [
        {
            "title": "Primary Insured",
            "fields": [
                {"name": "fullName", "type": "text", "label": "Full Name", "required": True},
                {"name": "age", "type": "number", "label": "Age", "required": True, "min": 18, "max": 75},
                {"name": "email", "type": "email", "label": "Email", "required": True},
                {"name": "phone", "type": "text", "label": "Phone", "required": True}
            ]
        },
        {
            "title": "Coverage",
            "fields": [
                {"name": "planTier", "type": "select", "label": "Plan Tier", "options": ["Bronze","Silver","Gold"], "required": True},
                {"name": "dependants", "type": "repeater", "label": "Dependants", "itemSchema": {"fields": [
                    {"name": "depName", "type": "text", "label": "Name", "required": True},
                    {"name": "depAge", "type": "number", "label": "Age", "required": True, "min": 0, "max": 75}
                ]}}
            ]
        }
    ]
}

TRAVEL_FORM_SCHEMA = {
    "version": 1,
    "sections": [
        {"title": "Traveller", "fields": [
            {"name": "fullName", "type": "text", "label": "Full Name", "required": True},
            {"name": "age", "type": "number", "label": "Age", "required": True, "min": 1, "max": 85}
        ]},
        {"title": "Trip Details", "fields": [
            {"name": "zone", "type": "select", "label": "Travel Zone", "options": ["REGIONAL","INTERNATIONAL"], "required": True},
            {"name": "tripDays", "type": "number", "label": "Trip Days", "required": True, "min": 1, "max": 180}
        ]}
    ]
}

LAST_EXPENSE_FORM_SCHEMA = {
    "version": 1,
    "sections": [
        {"title": "Insured", "fields": [
            {"name": "fullName", "type": "text", "label": "Full Name", "required": True},
            {"name": "age", "type": "number", "label": "Age", "required": True, "min": 18, "max": 90}
        ]},
        {"title": "Coverage", "fields": [
            {"name": "sumAssured", "type": "number", "label": "Sum Assured", "required": True, "min": 50000, "max": 1000000}
        ]}
    ]
}

class Command(BaseCommand):
    help = "Seed multi-line insurance lines and products"

    def handle(self, *args, **options):
        medical_line, _ = models.ProductLine.objects.get_or_create(code='MEDICAL', defaults={'name': 'Medical Insurance'})
        travel_line, _ = models.ProductLine.objects.get_or_create(code='TRAVEL', defaults={'name': 'Travel Insurance'})
        le_line, _ = models.ProductLine.objects.get_or_create(code='LAST_EXPENSE', defaults={'name': 'Last Expense Insurance'})

        models.ProductConfiguration.objects.get_or_create(
            code='MEDICAL_BASIC',
            defaults={
                'line': medical_line,
                'name': 'Medical Basic Plan',
                'pricing_model': 'FLAT',
                'form_schema': MEDICAL_FORM_SCHEMA,
                'base_rates': {'Bronze': 8000, 'Silver': 12000, 'Gold': 18000},
                'metadata': {'adapter_key': 'medical_basic'},
            }
        )
        models.ProductConfiguration.objects.get_or_create(
            code='TRAVEL_STANDARD',
            defaults={
                'line': travel_line,
                'name': 'Travel Standard Plan',
                'pricing_model': 'FLAT',
                'form_schema': TRAVEL_FORM_SCHEMA,
                'base_rates': {'REGIONAL': 1500, 'INTERNATIONAL': 4000},
                'metadata': {'adapter_key': 'travel_zone_duration'},
            }
        )
        models.ProductConfiguration.objects.get_or_create(
            code='LAST_EXP_STANDARD',
            defaults={
                'line': le_line,
                'name': 'Last Expense Standard',
                'pricing_model': 'FLAT',
                'form_schema': LAST_EXPENSE_FORM_SCHEMA,
                'base_rates': {'bands': [250000, 500000, 1000000]},
                'metadata': {'adapter_key': 'last_expense_sum_assured'},
            }
        )
        self.stdout.write(self.style.SUCCESS('Multi-line insurance seed completed.'))
