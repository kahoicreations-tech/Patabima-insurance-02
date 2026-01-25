from django.test import TestCase, Client, override_settings
from django.urls import reverse
from app.models import InsuranceProvider, MotorCategory, MotorSubcategory
from django.utils import timezone


@override_settings(DEBUG=True)
class ComparePricingExtendibleSourceTests(TestCase):
    def setUp(self):
        self.client = Client()
        # Create category and subcategory for an EXT product
        self.cat = MotorCategory.objects.create(
            code='PRIVATE', name='Private', description='Private vehicles'
        )
        self.sub = MotorSubcategory.objects.create(
            category=self.cat,
            subcategory_code='PRIVATE_THIRD_PARTY_EXT',
            subcategory_name='Private TP Extendible',
            product_type='THIRD_PARTY',
            pricing_model='FIXED',
            is_complex=False,
            additional_fields=[],
            pricing_requirements={},
            is_active=True,
        )

        # Provider with features.pricing configured for the EXT product
        self.provider_with_ext = InsuranceProvider.objects.create(
            name='Madison Insurance',
            code='MADISON',
            supported_categories=['PRIVATE'],
            features={
                'pricing': {
                    'PRIVATE_THIRD_PARTY_EXT': {
                        'pricing_type': 'fixed',
                        'base_premium': 7000,
                        'extendible_config': {
                            'initial_amount': 3600,
                            'balance_amount': 2400,
                            'total_annual_premium': 7000,
                            'initial_period_days': 30,
                            'extension_deadline_days': 30,
                            'grace_period_days': 7,
                            'penalty_for_late_extension': 0,
                            'allow_partial_extension': False,
                        }
                    }
                }
            }
        )
        
        # Provider WITHOUT extendible_config for the EXT product (should be filtered out)
        self.provider_without_ext = InsuranceProvider.objects.create(
            name='UAP Insurance',
            code='UAP',
            supported_categories=['PRIVATE'],
            features={
                'pricing': {
                    'PRIVATE_THIRD_PARTY_EXT': {
                        'pricing_type': 'fixed',
                        'base_premium': 6500,
                        # No extendible_config - should be excluded
                    }
                }
            }
        )

    def test_compare_uses_features_pricing_extendible_config(self):
        url = '/api/v1/public_app/insurance/compare_motor_pricing/'
        payload = {
            'category_code': 'PRIVATE',
            'subcategory_code': 'PRIVATE_THIRD_PARTY_EXT',
            'cover_start_date': timezone.now().date().strftime('%Y-%m-%d'),
            # No additional fields needed for fixed pricing
        }
        resp = self.client.post(url, data=payload)
        self.assertEqual(resp.status_code, 200, resp.content)
        data = resp.json()
        self.assertIn('comparisons', data)
        self.assertGreaterEqual(len(data['comparisons']), 1)
        # Find our provider entry
        entry = next((c for c in data['comparisons'] if c['result'].get('underwriter_code') == 'MADISON'), None)
        self.assertIsNotNone(entry, 'MADISON underwriter not in comparisons')
        result = entry['result']
        self.assertTrue(result.get('is_extendible'))
        self.assertEqual(result.get('payment_plan'), 'EXTENDIBLE')
        ext = result.get('extendible_config')
        self.assertIsInstance(ext, dict)
        # Backend now automatically adds levies (45 + 30 = 75) to the base amounts
        # Initial: 3600 + 45 = 3645, Balance: 2400 + 30 = 2430, Total: 7000 + 75 = 7075
        self.assertEqual(ext.get('initial_amount'), 3645.0)
        self.assertEqual(ext.get('balance_amount'), 2430.0)
        self.assertEqual(ext.get('total_annual_premium'), 7075.0)
        self.assertEqual(ext.get('initial_period_days'), 30)
        self.assertEqual(ext.get('extension_deadline_days'), 30)
        self.assertEqual(ext.get('grace_period_days'), 7)

    def test_ext_products_filter_out_underwriters_without_config(self):
        """For EXT products, only underwriters with extendible_config should be returned."""
        url = '/api/v1/public_app/insurance/compare_motor_pricing/'
        payload = {
            'category_code': 'PRIVATE',
            'subcategory_code': 'PRIVATE_THIRD_PARTY_EXT',
            'cover_start_date': timezone.now().date().strftime('%Y-%m-%d'),
        }
        resp = self.client.post(url, data=payload)
        self.assertEqual(resp.status_code, 200, resp.content)
        data = resp.json()
        self.assertIn('comparisons', data)
        
        # Should only have 1 underwriter (Madison with config)
        # UAP should be filtered out because it lacks extendible_config
        self.assertEqual(len(data['comparisons']), 1, 
                        f"Expected only 1 underwriter with extendible_config, got {len(data['comparisons'])}")
        
        # Verify it's Madison
        result = data['comparisons'][0]['result']
        self.assertEqual(result['underwriter_code'], 'MADISON')
        self.assertTrue(result.get('is_extendible'))
        self.assertIn('extendible_config', result)
        
        # Ensure UAP is NOT in the results
        uap_entry = next((c for c in data['comparisons'] if c['result'].get('underwriter_code') == 'UAP'), None)
        self.assertIsNone(uap_entry, 'UAP should have been filtered out (no extendible_config)')

    # Removed: tests referencing deprecated ExtendiblePricing table.
    # The system now exclusively uses InsuranceProvider.features.pricing for extendible products.