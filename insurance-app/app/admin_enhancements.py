from django.contrib import admin
from django import forms
from django.core.validators import RegexValidator
from django.contrib.auth import get_user_model
from django.db.models import Count

from .models import StaffUserProfile, PublicUserProfile, InsuranceQuotation


User = get_user_model()


class StaffUserProfileInline(admin.StackedInline):
    model = StaffUserProfile
    can_delete = False
    extra = 0
    fields = (
        'agent_code', 'agent_prefix',
        'full_names', 'idnum', 'dob', 'gender', 'physical_address',
        'is_email_verified', 'is_phone_verified',
    )


class PublicUserProfileInline(admin.StackedInline):
    model = PublicUserProfile
    can_delete = False
    extra = 0
    fields = (
        'registration_number',
        'full_names', 'idnum', 'dob', 'gender', 'physical_address',
        'is_email_verified', 'is_phone_verified',
    )


class EnhancedUserAdmin(admin.ModelAdmin):
    # Enforce exact 9-digit phone number in the admin UI
    class UserAdminForm(forms.ModelForm):
        phonenumber = forms.CharField(
            max_length=9,
            min_length=9,
            validators=[RegexValidator(r'^\d{9}$', message='Phone number must be exactly 9 digits (no leading 0). Example: 712345678')],
            help_text='Enter 9 digits, e.g., 712345678 (no leading 0)'
        )

        class Meta:
            model = User
            fields = '__all__'

    form = UserAdminForm
    list_display = (
        'phonenumber', 'email', 'role',
        'full_name_display', 'is_verified_display', 'quotation_count',
        'is_active', 'is_staff', 'last_login', 'date_created',
    )
    list_filter = (
        'role', 'is_active', 'is_staff', 'date_created',
        'staff_user_profile__is_email_verified', 'public_user_profile__is_email_verified',
    )
    search_fields = (
        'phonenumber', 'email',
        'public_user_profile__full_names',
        'staff_user_profile__full_names',
        'staff_user_profile__agent_code',
    )
    ordering = ('-date_created',)

    fieldsets = (
        ('Account', {
            'fields': ('phonenumber', 'email', 'password', 'role')
        }),
        ('Status', {
            'fields': ('is_active', 'is_staff', 'is_default_password', 'created_by')
        }),
        ('Timestamps', {
            'fields': ('last_login', 'date_created', 'date_updated')
        }),
    )
    readonly_fields = ('date_created', 'date_updated', 'last_login')

    actions = ['verify_email', 'verify_phone', 'reset_password_flag', 'send_welcome_sms']

    inlines = []

    def get_inline_instances(self, request, obj=None):
        inlines = []
        if obj:
            if obj.role == 'AGENT':
                inlines.append(StaffUserProfileInline(self.model, self.admin_site))
            elif obj.role == 'CUSTOMER':
                inlines.append(PublicUserProfileInline(self.model, self.admin_site))
        return inlines

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        qs = qs.annotate(total_quotations=Count('quotations'))
        return qs

    def full_name_display(self, obj):
        if hasattr(obj, 'staff_user_profile') and obj.staff_user_profile and obj.staff_user_profile.full_names:
            return obj.staff_user_profile.full_names
        if hasattr(obj, 'public_user_profile') and obj.public_user_profile and obj.public_user_profile.full_names:
            return obj.public_user_profile.full_names
        return '—'
    full_name_display.short_description = 'Full Name'

    def is_verified_display(self, obj):
        flags = []
        if hasattr(obj, 'staff_user_profile') and obj.staff_user_profile:
            if obj.staff_user_profile.is_email_verified:
                flags.append('Email✓')
            if obj.staff_user_profile.is_phone_verified:
                flags.append('Phone✓')
        if hasattr(obj, 'public_user_profile') and obj.public_user_profile:
            if obj.public_user_profile.is_email_verified:
                flags.append('Email✓')
            if obj.public_user_profile.is_phone_verified:
                flags.append('Phone✓')
        return ' '.join(flags) if flags else '✗'
    is_verified_display.short_description = 'Verified'

    def quotation_count(self, obj):
        count = getattr(obj, 'total_quotations', None)
        if count is None:
            count = InsuranceQuotation.objects.filter(agent=obj).count()
        return count
    quotation_count.short_description = 'Quotations'

    def verify_email(self, request, queryset):
        for user in queryset:
            if hasattr(user, 'staff_user_profile') and user.staff_user_profile:
                user.staff_user_profile.is_email_verified = True
                user.staff_user_profile.save(update_fields=['is_email_verified'])
            if hasattr(user, 'public_user_profile') and user.public_user_profile:
                user.public_user_profile.is_email_verified = True
                user.public_user_profile.save(update_fields=['is_email_verified'])
        self.message_user(request, f"Email verified for {queryset.count()} users")
    verify_email.short_description = 'Mark email as verified'

    def verify_phone(self, request, queryset):
        for user in queryset:
            if hasattr(user, 'staff_user_profile') and user.staff_user_profile:
                user.staff_user_profile.is_phone_verified = True
                user.staff_user_profile.save(update_fields=['is_phone_verified'])
            if hasattr(user, 'public_user_profile') and user.public_user_profile:
                user.public_user_profile.is_phone_verified = True
                user.public_user_profile.save(update_fields=['is_phone_verified'])
        self.message_user(request, f"Phone verified for {queryset.count()} users")
    verify_phone.short_description = 'Mark phone as verified'

    def reset_password_flag(self, request, queryset):
        updated = queryset.update(is_default_password=True)
        self.message_user(request, f"Set default-password flag for {updated} users")
    reset_password_flag.short_description = 'Mark as default password'

    def send_welcome_sms(self, request, queryset):
        # Placeholder for integration with SMS provider
        self.message_user(request, f"Queued welcome SMS for {queryset.count()} users")
    send_welcome_sms.short_description = 'Send welcome SMS (placeholder)'


# Try to replace the default User admin with the enhanced one
# DISABLED: User admin is now registered in main admin.py with comprehensive features
# try:
#     admin.site.unregister(User)
# except Exception:
#     pass

# try:
#     admin.site.register(User, EnhancedUserAdmin)
# except Exception:
#     pass
