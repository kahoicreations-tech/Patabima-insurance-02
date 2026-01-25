"""
Management command to generate a test JWT token for API testing
Usage: python manage.py generate_test_token <phonenumber>
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


class Command(BaseCommand):
    help = 'Generate a JWT access token for testing DMVIC endpoints'

    def add_arguments(self, parser):
        parser.add_argument('phonenumber', type=str, help='Phone number of the user')

    def handle(self, *args, **options):
        phonenumber = options['phonenumber']

        try:
            user = User.objects.get(phonenumber=phonenumber)
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'❌ User with phone number {phonenumber} not found'))
            return

        # Generate JWT token
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        expires_at = timezone.now() + timedelta(hours=2)

        self.stdout.write(self.style.SUCCESS('✅ Token generated successfully!\n'))
        self.stdout.write(self.style.SUCCESS(f'Phone: {user.phonenumber}'))
        self.stdout.write(self.style.SUCCESS(f'Role: {user.role}'))
        self.stdout.write(self.style.SUCCESS(f'User ID: {user.id}'))
        self.stdout.write(self.style.SUCCESS(f'Expires: {expires_at}\n'))
        self.stdout.write(self.style.WARNING('Access Token:'))
        self.stdout.write(access_token)
        self.stdout.write('\n')
        self.stdout.write(self.style.NOTICE('💡 Copy this token and use it in your test script'))
