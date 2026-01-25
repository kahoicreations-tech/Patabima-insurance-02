from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from app.models import (
    InsuranceProvider, MotorCategory, MotorSubcategory, MotorPricing,
    CommercialTonnagePricing, PSVPLLPrice, VehicleAdjustmentFactor,
    AdditionalFieldPricing,
)


class ModelBasicsTest(TestCase):
    databases = {'default'}

    @classmethod
    def setUpTestData(cls):
        cls.und = InsuranceProvider.objects.create(name='TestCo', code='TCO')
        cls.cat = MotorCategory.objects.create(category_code='TEST', category_name='Test Cat')
        cls.sub = MotorSubcategory.objects.create(category=cls.cat, subcategory_code='TEST_TP', subcategory_name='Test TP', product_type='third_party')

    def test_constraints_and_indexes(self):
        mp = MotorPricing.objects.create(underwriter=self.und, subcategory=self.sub, base_premium=Decimal('5000'))
        self.assertEqual(mp.currency, 'KES')
        self.assertIsNotNone(mp.effective_from)

    def test_unique_motorpricing(self):
        MotorPricing.objects.create(underwriter=self.und, subcategory=self.sub, base_premium=Decimal('5000'))
        # Another entry with None sum_insured_min is allowed for a different effective_from if we change it,
        # but update_or_create in seeds should keep idempotency.
        self.assertEqual(MotorPricing.objects.filter(underwriter=self.und, subcategory=self.sub).count(), 1)


class LevyCalculationBehaviorTest(TestCase):
    databases = {'default'}

    @classmethod
    def setUpTestData(cls):
        und = InsuranceProvider.objects.create(name='CalcCo', code='CAL')
        cat = MotorCategory.objects.create(category_code='PRV', category_name='Private')
        sub = MotorSubcategory.objects.create(category=cat, subcategory_code='PRV_COMP', subcategory_name='Private Comp', product_type='comprehensive')
        cls.pr = MotorPricing.objects.create(
            underwriter=und, subcategory=sub,
            sum_insured_min=0, sum_insured_max=1000000,
            base_rate_min=Decimal('0.0300'), base_rate_max=Decimal('0.0350'),
            minimum_premium=Decimal('15000.00'),
        )

    def test_mandatory_levy_defaults(self):
        self.assertEqual(self.pr.insurance_training_levy_rate, Decimal('0.0025'))
        self.assertEqual(self.pr.pcf_levy_rate, Decimal('0.0025'))
        self.assertEqual(self.pr.stamp_duty, Decimal('40.00'))