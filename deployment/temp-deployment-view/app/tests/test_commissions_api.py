from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from decimal import Decimal
from django.utils import timezone

from app.models import User, AgentCommission, MotorPolicy


class CommissionsAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(phonenumber='712345678', password='Passw0rd!')
        self.client.force_authenticate(user=self.user)

    def test_summary_and_list_empty(self):
        # Summary should work even with no data
        url = '/api/v1/public_app/commissions/summary'
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.json()
        self.assertIn('total_commission', data)
        self.assertIn('month_period', data)

        # List should return empty items
        list_url = '/api/v1/public_app/commissions/list'
        resp2 = self.client.get(list_url)
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)
        self.assertEqual(resp2.json().get('items'), [])

    def test_list_with_filters(self):
        # Create a dummy policy and one commission
        pol = MotorPolicy.objects.create(
            policy_number='POL-TEST-0001',
            user=self.user,
            client_details={},
            vehicle_details={},
            product_details={},
            underwriter_details={},
            premium_breakdown={'total_premium': '1000.00'},
            payment_details={'amount': '1000.00'},
            status='ACTIVE',
        )
        AgentCommission.objects.create(
            agent=self.user,
            policy=pol,
            premium_amount=Decimal('1000.00'),
            commission_rate=Decimal('10.00'),
            commission_amount=Decimal('100.00'),
            payment_status='PENDING',
        )

        # List
        resp = self.client.get('/api/v1/public_app/commissions/list?status=PENDING&limit=10')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        items = resp.json().get('items')
        self.assertTrue(len(items) >= 1)
        self.assertEqual(items[0]['payment_status'], 'PENDING')