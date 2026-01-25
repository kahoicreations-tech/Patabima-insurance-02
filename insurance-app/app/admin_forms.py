from django import forms
from .models import Underwriter, InsuranceProvider, MotorCategory, MotorSubcategory, CommissionRule


class ClonePricingForm(forms.Form):
    # Use InsuranceProvider (modern model used by MotorPricing.underwriter)
    target_underwriter = forms.ModelChoiceField(
        queryset=InsuranceProvider.objects.filter(is_active=True),
        label="Target Insurance Provider",
    )
    adjustment_percentage = forms.DecimalField(
        max_digits=6, decimal_places=2, initial=0, label="Adjustment % (e.g. 5 or -5)"
    )


class BulkPricingUpdateForm(forms.Form):
    PRICING_FIELDS = [
        ('base_premium', 'Base Premium'),
        ('minimum_premium', 'Minimum Premium'),
        ('maximum_premium', 'Maximum Premium'),
    ]
    pricing_field = forms.ChoiceField(choices=PRICING_FIELDS)
    percentage_change = forms.DecimalField(
        max_digits=6, decimal_places=2, label="% Change (e.g. 5 or -5)"
    )
    categories = forms.ModelMultipleChoiceField(
        queryset=MotorCategory.objects.all(), required=False, label="Filter by Categories",
        widget=forms.CheckboxSelectMultiple
    )
    subcategories = forms.ModelMultipleChoiceField(
        queryset=MotorSubcategory.objects.all(), required=False, label="Filter by Subcategories",
        widget=forms.CheckboxSelectMultiple
    )


class InsuranceProviderAdminForm(forms.ModelForm):
    class Meta:
        model = InsuranceProvider
        fields = [
            'name', 'code', 'contact_email', 'contact_phone', 'address',
            'supported_categories', 'supported_payment_methods', 'features'
        ]

    def clean_code(self):
        code = self.cleaned_data.get('code')
        if code:
            return code.upper().strip()
        return code


class CommissionRuleAdminForm(forms.ModelForm):
    """Custom form for CommissionRule to offer a dropdown for common non-motor line keys."""

    NON_MOTOR_LINE_CHOICES = [
        ('', '---------'),
        ('MEDICAL', 'Medical'),
        ('TRAVEL', 'Travel'),
        ('LAST_EXPENSE', 'Last Expense'),
        ('WIBA', 'WIBA'),
        ('DOMESTIC_PACKAGE', 'Domestic Package'),
        ('PERSONAL_ACCIDENT', 'Personal Accident'),
    ]

    line_key = forms.ChoiceField(
        choices=NON_MOTOR_LINE_CHOICES,
        required=False,
        help_text='For non-motor lines e.g., MEDICAL, TRAVEL'
    )

    class Meta:
        model = CommissionRule
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # If the instance has a line_key that is not in predefined choices, append it
        current = None
        try:
            if self.instance and getattr(self.instance, 'line_key', None):
                current = str(self.instance.line_key or '').strip().upper()
        except Exception:
            current = None
        if current and current not in [c[0] for c in self.fields['line_key'].choices]:
            self.fields['line_key'].choices = [(current, current.replace('_', ' ').title())] + list(self.fields['line_key'].choices)

    def clean_line_key(self):
        value = self.cleaned_data.get('line_key')
        # Normalize to uppercase or empty
        value = (value or '').strip().upper()
        return value or None
