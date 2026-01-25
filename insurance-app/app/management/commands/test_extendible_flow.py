"""
Django Management Command: Test Extendible Product End-to-End Flow
===================================================================

This command creates test data to simulate the complete extendible product lifecycle:
1. Create a test client with extendible policy
2. Simulate initial payment (30-day cover)
3. Policy activated with initial period coverage
4. Policy appears in Upcoming Extensions after expiry
5. Simulate balance payment
6. Policy extended to full year

Usage:
    python manage.py test_extendible_flow
    python manage.py test_extendible_flow --product PRIVATE_THIRD_PARTY_EXT
    python manage.py test_extendible_flow --underwriter CIC
    python manage.py test_extendible_flow --skip-payment  # Test without payment
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import uuid

from app.models import (
    MotorPolicy,
    MotorSubcategory,
    InsuranceProvider,
    ExtendiblePricing,
    User
)


class Command(BaseCommand):
    help = 'Test extendible product end-to-end flow'

    def add_arguments(self, parser):
        parser.add_argument(
            '--product',
            type=str,
            default='PRIVATE_THIRD_PARTY_EXT',
            help='Extendible product code (default: PRIVATE_THIRD_PARTY_EXT)'
        )
        parser.add_argument(
            '--underwriter',
            type=str,
            default='CIC',
            help='Underwriter code (default: CIC)'
        )
        parser.add_argument(
            '--skip-payment',
            action='store_true',
            help='Create policy without simulating payment'
        )
        parser.add_argument(
            '--expired',
            action='store_true',
            help='Create expired policy for extension testing'
        )

    def handle(self, *args, **options):
        product_code = options['product']
        underwriter_code = options['underwriter']
        skip_payment = options['skip_payment']
        create_expired = options['expired']

        self.stdout.write("=" * 80)
        self.stdout.write(self.style.SUCCESS("EXTENDIBLE PRODUCT END-TO-END FLOW TEST"))
        self.stdout.write("=" * 80)
        self.stdout.write("")

        # Step 1: Get extendible subcategory
        self.stdout.write("Step 1: Fetching product configuration...")
        try:
            subcategory = MotorSubcategory.objects.get(
                subcategory_code=product_code,
                is_active=True
            )
            self.stdout.write(self.style.SUCCESS(
                f"✓ Product: {subcategory.subcategory_name} ({subcategory.subcategory_code})"
            ))
        except MotorSubcategory.DoesNotExist:
            self.stdout.write(self.style.ERROR(
                f"✗ Product not found: {product_code}"
            ))
            return

        # Step 2: Get underwriter
        try:
            underwriter = InsuranceProvider.objects.get(
                code=underwriter_code,
                is_active=True
            )
            self.stdout.write(self.style.SUCCESS(
                f"✓ Underwriter: {underwriter.name} ({underwriter.code})"
            ))
        except InsuranceProvider.DoesNotExist:
            self.stdout.write(self.style.ERROR(
                f"✗ Underwriter not found: {underwriter_code}"
            ))
            return

        # Step 3: Get ExtendiblePricing configuration
        try:
            ext_pricing = ExtendiblePricing.objects.get(
                subcategory=subcategory,
                underwriter=underwriter
            )
            self.stdout.write(self.style.SUCCESS(
                f"✓ Pricing Config Found:"
            ))
            self.stdout.write(f"  - Initial Amount: KSh {ext_pricing.initial_amount:,.2f}")
            self.stdout.write(f"  - Balance Amount: KSh {ext_pricing.balance_amount:,.2f}")
            self.stdout.write(f"  - Total Annual Premium: KSh {ext_pricing.total_annual_premium:,.2f}")
            self.stdout.write(f"  - Extension Deadline: {ext_pricing.extension_deadline_days} days")
            self.stdout.write(f"  - Late Penalty: {ext_pricing.penalty_for_late_extension}%")
        except ExtendiblePricing.DoesNotExist:
            self.stdout.write(self.style.ERROR(
                f"✗ No ExtendiblePricing configuration found for {product_code} + {underwriter_code}"
            ))
            self.stdout.write(self.style.WARNING(
                "Run: python manage.py shell < create_extendible_pricing.py"
            ))
            return

        self.stdout.write("")

        # Step 4: Get or create test user
        self.stdout.write("Step 2: Creating test client...")
        test_phonenumber = '712345678'
        try:
            test_user = User.objects.get(phonenumber=test_phonenumber)
            self.stdout.write(self.style.SUCCESS(
                f"✓ Using existing test user: +254{test_user.phonenumber}"
            ))
        except User.DoesNotExist:
            test_user = User.objects.create(
                phonenumber=test_phonenumber,
                email='test_extendible@example.com',
                role='CUSTOMER',
                nationality='KENYAN',
                country_code='+254',
            )
            test_user.set_password('test1234')
            test_user.save()
            self.stdout.write(self.style.SUCCESS(
                f"✓ Created test user: +254{test_user.phonenumber}"
            ))

        self.stdout.write("")

        # Step 5: Create test policy
        self.stdout.write("Step 3: Creating test extendible policy...")
        
        # Generate unique identifiers
        policy_number = f"POL-TEST-{uuid.uuid4().hex[:8].upper()}"
        quote_id = f"QUO-TEST-{uuid.uuid4().hex[:8].upper()}"
        
        # Calculate dates
        if create_expired:
            # Create expired policy for extension testing
            cover_start = timezone.now().date() - timedelta(days=60)  # 60 days ago
            cover_end = cover_start + timedelta(days=ext_pricing.initial_period_days)  # Expired 30 days ago
            status = 'EXPIRED'
            self.stdout.write(self.style.WARNING(
                "Creating EXPIRED policy for extension testing..."
            ))
        else:
            cover_start = timezone.now().date()
            cover_end = cover_start + timedelta(days=ext_pricing.initial_period_days)
            status = 'PENDING_PAYMENT' if skip_payment else 'ACTIVE'

        policy_data = {
            'policy_number': policy_number,
            'quote_id': quote_id,
            'user': test_user,
            'status': status,
            
            # Client details
            'client_details': {
                'fullName': 'John Doe Extendible Test',
                'id_number': '12345678',
                'kra_pin': 'A001234567X',
                'phone': '+254712345678',
                'email': 'test_extendible@example.com',
            },
            
            # Vehicle details
            'vehicle_details': {
                'registration': f'KDD-{uuid.uuid4().hex[:3].upper()}T',
                'make': 'Toyota',
                'model': 'Corolla',
                'year': 2020,
                'chassis_number': f'CHASSIS{uuid.uuid4().hex[:10].upper()}',
                'engine_number': f'ENGINE{uuid.uuid4().hex[:10].upper()}',
            },
            
            # Product details (includes extendible info)
            'product_details': {
                'category': subcategory.category.code,
                'subcategory_code': subcategory.subcategory_code,  # This is what is_extendable looks for
                'subcategory_name': subcategory.subcategory_name,
                'product_type': 'THIRD_PARTY',
                'is_extendible': True,
                'extendible_config': {
                    'initial_period_days': ext_pricing.initial_period_days,
                    'initial_amount': float(ext_pricing.initial_amount),
                    'balance_amount': float(ext_pricing.balance_amount),
                    'total_annual_premium': float(ext_pricing.total_annual_premium),
                    'extension_deadline_days': ext_pricing.extension_deadline_days,
                    'payment_plan': 'installments',
                },
            },
            
            # Premium breakdown (initial payment only)
            'premium_breakdown': {
                'base_premium': float(ext_pricing.initial_amount),
                'ITL': float(ext_pricing.initial_amount * Decimal('0.0025')),
                'PCF': float(ext_pricing.initial_amount * Decimal('0.0025')),
                'stamp_duty': 40.00,
                'total_amount': float(ext_pricing.initial_amount),
            },
            
            # Underwriter details
            'underwriter_details': {
                'id': str(underwriter.id),
                'name': underwriter.name,
                'code': underwriter.code,
            },
            
            # Payment details (initial payment)
            'payment_details': {
                'method': 'MPESA',
                'amount': float(ext_pricing.initial_amount),
                'status': 'PENDING' if skip_payment else 'COMPLETED',
                'transaction_id': f'MPESA{uuid.uuid4().hex[:8].upper()}' if not skip_payment else None,
            },
            
            # Cover dates
            'cover_start_date': cover_start,
            'cover_end_date': cover_end,
            
            # Agent code
            'agent_code': 'AGENT001',
        }
        
        # Create policy
        policy = MotorPolicy.objects.create(**policy_data)
        
        self.stdout.write(self.style.SUCCESS(f"✓ Policy created: {policy.policy_number}"))
        self.stdout.write(f"  - Status: {policy.status}")
        self.stdout.write(f"  - Quote ID: {policy.quote_id}")
        self.stdout.write(f"  - Vehicle: {policy.vehicle_details['registration']}")
        self.stdout.write(f"  - Initial Payment: KSh {ext_pricing.initial_amount:,.2f}")
        self.stdout.write(f"  - Cover Start: {policy.cover_start_date}")
        self.stdout.write(f"  - Cover End (Initial): {policy.cover_end_date}")
        
        if create_expired:
            days_since_expiry = (timezone.now().date() - policy.cover_end_date).days
            grace_remaining = ext_pricing.extension_deadline_days - days_since_expiry
            self.stdout.write(self.style.WARNING(
                f"  - Days Since Expiry: {days_since_expiry}"
            ))
            self.stdout.write(self.style.WARNING(
                f"  - Grace Remaining: {grace_remaining} days"
            ))
            
            # Calculate late fee
            if days_since_expiry > 30:
                late_fee_pct = ext_pricing.penalty_for_late_extension
                late_fee_amount = ext_pricing.balance_amount * (late_fee_pct / 100)
                total_payment = ext_pricing.balance_amount + late_fee_amount
                self.stdout.write(self.style.ERROR(
                    f"  - Late Fee ({late_fee_pct}%): KSh {late_fee_amount:,.2f}"
                ))
                self.stdout.write(self.style.ERROR(
                    f"  - Total Payment Required: KSh {total_payment:,.2f}"
                ))

        self.stdout.write("")

        # Step 6: Simulate payment activation (if not skipped)
        if not skip_payment and not create_expired:
            self.stdout.write("Step 4: Simulating payment activation...")
            # In real flow, this happens via payment webhook
            # For testing, we just print what would happen
            self.stdout.write(self.style.SUCCESS(
                "✓ Policy would be activated with:"
            ))
            self.stdout.write(f"  - 30-day cover note issued")
            self.stdout.write(f"  - Email sent to client")
            self.stdout.write(f"  - Cover valid until: {cover_end}")
            self.stdout.write("")

        # Step 7: Check policy properties
        self.stdout.write("Step 5: Checking policy computed properties...")
        self.stdout.write(f"  - is_renewable: {policy.is_renewable}")
        self.stdout.write(f"  - is_extendable: {policy.is_extendable}")
        
        if policy.is_extendable:
            self.stdout.write(self.style.SUCCESS(
                f"  - extension_grace_end: {policy.extension_grace_end}"
            ))
        
        self.stdout.write("")

        # Final summary
        self.stdout.write("=" * 80)
        self.stdout.write(self.style.SUCCESS("TEST SUMMARY"))
        self.stdout.write("=" * 80)
        self.stdout.write("")
        self.stdout.write(f"Policy Number: {policy.policy_number}")
        self.stdout.write(f"Product: {subcategory.subcategory_name}")
        self.stdout.write(f"Underwriter: {underwriter.name}")
        self.stdout.write(f"Initial Payment: KSh {ext_pricing.initial_amount:,.2f}")
        self.stdout.write(f"Balance Due: KSh {ext_pricing.balance_amount:,.2f}")
        self.stdout.write(f"Extension Deadline: {ext_pricing.extension_deadline_days} days from expiry")
        self.stdout.write("")
        
        if create_expired:
            self.stdout.write(self.style.WARNING("NEXT STEPS FOR EXTENSION TESTING:"))
            self.stdout.write("1. Check Upcoming Extensions screen (should show this policy)")
            self.stdout.write("2. Navigate to extension payment")
            self.stdout.write("3. Pay balance amount + late fee")
            self.stdout.write("4. Verify policy extended to full year")
        else:
            self.stdout.write(self.style.SUCCESS("NEXT STEPS:"))
            self.stdout.write("1. Client receives initial 30-day cover")
            self.stdout.write("2. Client has 90 days to pay balance")
            self.stdout.write("3. After 30 days, policy expires")
            self.stdout.write("4. Policy appears in Upcoming Extensions screen")
            self.stdout.write("5. Client pays balance to extend to full year")
        
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("✓ Test complete!"))
        self.stdout.write("")
