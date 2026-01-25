# M-PESA Payment Gateway Integration Guide

## PataBima Motor3 Insurance Payment System

**Last Updated**: December 30, 2025  
**Status**: Implementation Ready  
**Environment**: Sandbox → Production

---

## Table of Contents

1. [Overview](#overview)
2. [Daraja API 3.0 Architecture](#daraja-api-30-architecture)
3. [Integration Requirements](#integration-requirements)
4. [Sandbox Setup](#sandbox-setup)
5. [Backend Implementation](#backend-implementation)
6. [Frontend Implementation](#frontend-implementation)
7. [Testing Strategy](#testing-strategy)
8. [Production Deployment](#production-deployment)
9. [Security Considerations](#security-considerations)
10. [Troubleshooting](#troubleshooting)

---

## Overview

### What We're Building

A secure, real-time M-PESA payment integration for Motor3 insurance quotations using Safaricom's Daraja API 3.0 (STK Push / M-PESA Express).

### Flow Summary

```
User (Frontend) → PataBima Backend → Daraja API → M-PESA → User's Phone
                         ↓                              ↓
                    Store Transaction          STK Push Prompt
                         ↓                              ↓
                    Poll Status ← ← ← ← ← ← ← User Enters PIN
                         ↓                              ↓
                  Update Policy ← Webhook Callback ← Payment Success
```

### Key Features

- **STK Push**: Direct payment prompt to user's phone
- **Real-time Status**: Polling + webhook for instant confirmation
- **Sandbox Testing**: Full test environment before production
- **Fallback Support**: DPO Pay as alternative gateway
- **Transaction Tracking**: Comprehensive audit trail

---

## Daraja API 3.0 Architecture

### API Endpoints (Sandbox)

| Endpoint         | URL                                                                               | Purpose              |
| ---------------- | --------------------------------------------------------------------------------- | -------------------- |
| **OAuth Token**  | `https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials` | Get access token     |
| **STK Push**     | `https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest`                 | Initiate payment     |
| **Query Status** | `https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query`                     | Check payment status |

### Authentication Flow

```python
# Step 1: Generate OAuth Token
headers = {
    'Authorization': f'Basic {base64_consumer_key_secret}'
}
response = requests.get(oauth_url, headers=headers)
access_token = response.json()['access_token']

# Step 2: Use token for subsequent requests
headers = {
    'Authorization': f'Bearer {access_token}',
    'Content-Type': 'application/json'
}
```

---

## Integration Requirements

### Backend Requirements

#### 1. Environment Variables (`.env`)

```env
# M-PESA Sandbox Credentials
MPESA_ENVIRONMENT=sandbox  # sandbox | production
MPESA_CONSUMER_KEY=your_sandbox_consumer_key
MPESA_CONSUMER_SECRET=your_sandbox_consumer_secret
MPESA_SHORTCODE=174379  # Sandbox test shortcode
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_CALLBACK_URL=https://api.hugo-shopping.com/api/v1/public_app/payments/webhook
MPESA_TIMEOUT_URL=https://api.hugo-shopping.com/api/v1/payments/mpesa/timeout

# Production Credentials (when ready)
MPESA_PROD_CONSUMER_KEY=
MPESA_PROD_CONSUMER_SECRET=
MPESA_PROD_SHORTCODE=
MPESA_PROD_PASSKEY=
```

#### 2. Python Dependencies

```bash
pip install requests python-decouple cryptography
```

#### 3. Database Models

```python
# app/models.py
class MPESATransaction(models.Model):
    """Track M-PESA payment transactions"""

    # Transaction identification
    merchant_request_id = models.CharField(max_length=100, unique=True)
    checkout_request_id = models.CharField(max_length=100, unique=True)

    # Payment details
    phone_number = models.CharField(max_length=15)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    account_reference = models.CharField(max_length=100)  # Quote/Policy number
    description = models.CharField(max_length=200)

    # Status tracking
    status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', 'Pending'),
            ('SUCCESS', 'Success'),
            ('FAILED', 'Failed'),
            ('CANCELLED', 'Cancelled'),
            ('TIMEOUT', 'Timeout'),
        ],
        default='PENDING'
    )

    # M-PESA response data
    mpesa_receipt_number = models.CharField(max_length=100, blank=True, null=True)
    transaction_date = models.DateTimeField(blank=True, null=True)
    result_code = models.IntegerField(blank=True, null=True)
    result_description = models.TextField(blank=True, null=True)

    # Timestamps
    initiated_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    # Related quotation
    quotation = models.ForeignKey(
        'Quotation',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='mpesa_transactions'
    )

    class Meta:
        db_table = 'app_mpesa_transaction'
        ordering = ['-initiated_at']
```

### Frontend Requirements

#### 1. PaymentService Enhancement

```javascript
// frontend/services/PaymentService.js
class PaymentService {
  async initiateMpesaPayment(
    phoneNumber,
    amount,
    accountReference,
    description
  ) {
    try {
      const response = await this.api.makeRequest(
        "/api/v1/payments/mpesa/initiate",
        {
          method: "POST",
          body: JSON.stringify({
            phone_number: phoneNumber,
            amount: amount,
            account_reference: accountReference,
            description: description,
          }),
        }
      );

      return {
        success: true,
        checkout_request_id: response.checkout_request_id,
        merchant_request_id: response.merchant_request_id,
      };
    } catch (error) {
      console.error("M-PESA initiation failed:", error);
      throw error;
    }
  }

  async pollPaymentStatus(
    checkoutRequestId,
    maxAttempts = 30,
    interval = 2000
  ) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.checkMpesaPaymentStatus(checkoutRequestId);

      if (status.status === "SUCCESS") {
        return { success: true, receipt: status.mpesa_receipt_number };
      }

      if (status.status === "FAILED" || status.status === "CANCELLED") {
        return { success: false, reason: status.result_description };
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error("Payment timeout - please check M-PESA messages");
  }
}
```

---

## Sandbox Setup

### Step 1: Register on Daraja

1. Visit [https://developer.safaricom.co.ke/](https://developer.safaricom.co.ke/)
2. Create account (Company or Individual)
3. Verify email
4. Login to Dashboard

### Step 2: Create Sandbox App

1. Navigate to **My Apps** → **Create New App**
2. App Details:
   - **Name**: PataBima Insurance Sandbox
   - **Description**: Motor insurance payment processing (sandbox)
   - **APIs**: Select **M-PESA Express (STK Push)**
3. Submit and wait for approval (usually instant)

### Step 3: Get Sandbox Credentials

Once approved, navigate to **My Apps** → **PataBima Insurance Sandbox**:

```
Consumer Key: XxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx
Consumer Secret: YyYyYyYyYyYyYyYyYyYyYyYyYyYyYyYy
```

### Step 4: Sandbox Test Credentials

Safaricom provides test shortcode and passkey:

```
Shortcode: 174379
Passkey: bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
Test Phone: 254708374149 (any 2547xxxxxxxx works in sandbox)
```

### Step 5: Test in Postman

**OAuth Token Request**:

```bash
curl --location 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials' \
--header 'Authorization: Basic BASE64(consumer_key:consumer_secret)'
```

**STK Push Request**:

```bash
curl --location 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest' \
--header 'Authorization: Bearer {access_token}' \
--header 'Content-Type: application/json' \
--data '{
  "BusinessShortCode": "174379",
  "Password": "BASE64(Shortcode+Passkey+Timestamp)",
  "Timestamp": "20251230143045",
  "TransactionType": "CustomerPayBillOnline",
  "Amount": "1",
  "PartyA": "254708374149",
  "PartyB": "174379",
  "PhoneNumber": "254708374149",
  "CallBackURL": "https://yourdomain.com/callback",
  "AccountReference": "TEST-001",
  "TransactionDesc": "Test Payment"
}'
```

---

## Backend Implementation

### File Structure

```
insurance-app/
├── app/
│   ├── models.py (MPESATransaction model)
│   ├── views.py (Payment endpoints)
│   ├── serializers.py (Payment serializers)
│   └── services/
│       └── mpesa_service.py (NEW - M-PESA business logic)
├── insurance/
│   └── settings.py (Add M-PESA configs)
└── requirements.txt (Update dependencies)
```

### Implementation: `app/services/mpesa_service.py`

```python
"""
M-PESA Daraja API 3.0 Integration Service
Handles STK Push, status queries, and webhook processing
"""

import base64
import requests
from datetime import datetime
from django.conf import settings
from django.utils import timezone
from app.models import MPESATransaction, Quotation


class MPESAService:
    """
    Safaricom M-PESA API integration using Daraja 3.0
    Supports sandbox and production environments
    """

    def __init__(self):
        self.environment = getattr(settings, 'MPESA_ENVIRONMENT', 'sandbox')
        self.is_sandbox = self.environment == 'sandbox'

        # API URLs
        if self.is_sandbox:
            self.base_url = 'https://sandbox.safaricom.co.ke'
        else:
            self.base_url = 'https://api.safaricom.co.ke'

        # Credentials
        self.consumer_key = settings.MPESA_CONSUMER_KEY
        self.consumer_secret = settings.MPESA_CONSUMER_SECRET
        self.shortcode = settings.MPESA_SHORTCODE
        self.passkey = settings.MPESA_PASSKEY
        self.callback_url = settings.MPESA_CALLBACK_URL
        self.timeout_url = settings.MPESA_TIMEOUT_URL

    def get_access_token(self):
        """
        Generate OAuth access token for API authentication
        Token valid for 1 hour
        """
        url = f'{self.base_url}/oauth/v1/generate?grant_type=client_credentials'

        # Base64 encode credentials
        credentials = f'{self.consumer_key}:{self.consumer_secret}'
        encoded = base64.b64encode(credentials.encode()).decode()

        headers = {
            'Authorization': f'Basic {encoded}'
        }

        try:
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            return response.json()['access_token']
        except Exception as e:
            print(f'[MPESAService] Token generation failed: {e}')
            raise Exception('Failed to authenticate with M-PESA API')

    def generate_password(self, timestamp):
        """
        Generate M-PESA password: Base64(Shortcode + Passkey + Timestamp)
        """
        data_to_encode = f'{self.shortcode}{self.passkey}{timestamp}'
        return base64.b64encode(data_to_encode.encode()).decode()

    def initiate_stk_push(self, phone_number, amount, account_reference, description):
        """
        Initiate STK Push to customer's phone

        Args:
            phone_number (str): Customer phone (254XXXXXXXXX)
            amount (float): Amount to charge
            account_reference (str): Quote/Policy number
            description (str): Transaction description

        Returns:
            dict: Transaction details with checkout_request_id
        """
        # Normalize phone number
        phone = self._normalize_phone(phone_number)

        # Generate timestamp and password
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password = self.generate_password(timestamp)

        # Get access token
        access_token = self.get_access_token()

        # STK Push payload
        url = f'{self.base_url}/mpesa/stkpush/v1/processrequest'
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        payload = {
            'BusinessShortCode': self.shortcode,
            'Password': password,
            'Timestamp': timestamp,
            'TransactionType': 'CustomerPayBillOnline',
            'Amount': int(amount),
            'PartyA': phone,
            'PartyB': self.shortcode,
            'PhoneNumber': phone,
            'CallBackURL': self.callback_url,
            'AccountReference': account_reference,
            'TransactionDesc': description
        }

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            data = response.json()

            # Save transaction to database
            transaction = MPESATransaction.objects.create(
                merchant_request_id=data['MerchantRequestID'],
                checkout_request_id=data['CheckoutRequestID'],
                phone_number=phone,
                amount=amount,
                account_reference=account_reference,
                description=description,
                status='PENDING'
            )

            return {
                'success': True,
                'checkout_request_id': data['CheckoutRequestID'],
                'merchant_request_id': data['MerchantRequestID'],
                'customer_message': data.get('CustomerMessage', 'Payment prompt sent to phone'),
                'transaction_id': transaction.id
            }

        except requests.exceptions.RequestException as e:
            print(f'[MPESAService] STK Push failed: {e}')
            raise Exception(f'Failed to initiate M-PESA payment: {str(e)}')

    def query_transaction_status(self, checkout_request_id):
        """
        Query transaction status from M-PESA

        Args:
            checkout_request_id (str): CheckoutRequestID from STK Push

        Returns:
            dict: Transaction status details
        """
        # Get access token
        access_token = self.get_access_token()

        # Generate timestamp and password
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password = self.generate_password(timestamp)

        # Query payload
        url = f'{self.base_url}/mpesa/stkpushquery/v1/query'
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        payload = {
            'BusinessShortCode': self.shortcode,
            'Password': password,
            'Timestamp': timestamp,
            'CheckoutRequestID': checkout_request_id
        }

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            data = response.json()

            # Update local transaction
            try:
                transaction = MPESATransaction.objects.get(
                    checkout_request_id=checkout_request_id
                )

                result_code = data.get('ResultCode')
                if result_code == '0':
                    transaction.status = 'SUCCESS'
                elif result_code == '1032':
                    transaction.status = 'CANCELLED'
                elif result_code:
                    transaction.status = 'FAILED'

                transaction.result_code = result_code
                transaction.result_description = data.get('ResultDesc', '')
                transaction.save()
            except MPESATransaction.DoesNotExist:
                pass

            return {
                'success': True,
                'status': transaction.status if 'transaction' in locals() else 'UNKNOWN',
                'result_code': data.get('ResultCode'),
                'result_description': data.get('ResultDesc', '')
            }

        except requests.exceptions.RequestException as e:
            print(f'[MPESAService] Status query failed: {e}')
            return {
                'success': False,
                'status': 'PENDING',
                'error': str(e)
            }

    def process_callback(self, callback_data):
        """
        Process M-PESA callback/webhook

        Args:
            callback_data (dict): Webhook payload from M-PESA

        Returns:
            dict: Processing result
        """
        try:
            body = callback_data.get('Body', {}).get('stkCallback', {})

            merchant_request_id = body.get('MerchantRequestID')
            checkout_request_id = body.get('CheckoutRequestID')
            result_code = body.get('ResultCode')
            result_desc = body.get('ResultDesc')

            # Find transaction
            transaction = MPESATransaction.objects.get(
                checkout_request_id=checkout_request_id
            )

            # Update status
            if result_code == 0:
                transaction.status = 'SUCCESS'

                # Extract callback metadata
                callback_metadata = body.get('CallbackMetadata', {}).get('Item', [])
                for item in callback_metadata:
                    if item['Name'] == 'MpesaReceiptNumber':
                        transaction.mpesa_receipt_number = item['Value']
                    elif item['Name'] == 'TransactionDate':
                        # Convert 20251230143045 to datetime
                        date_str = str(item['Value'])
                        transaction.transaction_date = datetime.strptime(
                            date_str, '%Y%m%d%H%M%S'
                        )
            else:
                transaction.status = 'FAILED'

            transaction.result_code = result_code
            transaction.result_description = result_desc
            transaction.completed_at = timezone.now()
            transaction.save()

            # Update related quotation status if payment succeeded
            if transaction.status == 'SUCCESS' and transaction.quotation:
                transaction.quotation.status = 'ACTIVE'
                transaction.quotation.save()

            return {
                'success': True,
                'status': transaction.status,
                'receipt': transaction.mpesa_receipt_number
            }

        except MPESATransaction.DoesNotExist:
            return {'success': False, 'error': 'Transaction not found'}
        except Exception as e:
            print(f'[MPESAService] Callback processing failed: {e}')
            return {'success': False, 'error': str(e)}

    def _normalize_phone(self, phone):
        """Normalize phone number to 254XXXXXXXXX format"""
        phone = str(phone).strip().replace(' ', '').replace('+', '')

        if phone.startswith('0'):
            phone = '254' + phone[1:]
        elif phone.startswith('7') or phone.startswith('1'):
            phone = '254' + phone

        return phone


# Singleton instance
mpesa_service = MPESAService()
```

### Implementation: Django Views

```python
# app/views.py (add to existing views)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from app.services.mpesa_service import mpesa_service


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_mpesa_payment(request):
    """
    Initiate M-PESA STK Push payment

    POST /api/v1/payments/mpesa/initiate
    Body: {
        "phone_number": "0712345678",
        "amount": 3029.88,
        "account_reference": "QT-2025-001234",
        "description": "Motor3 Third Party Insurance"
    }
    """
    try:
        phone_number = request.data.get('phone_number')
        amount = request.data.get('amount')
        account_reference = request.data.get('account_reference')
        description = request.data.get('description', 'Insurance Payment')

        # Validate inputs
        if not all([phone_number, amount, account_reference]):
            return Response({
                'success': False,
                'error': 'Missing required fields'
            }, status=400)

        # Initiate STK Push
        result = mpesa_service.initiate_stk_push(
            phone_number=phone_number,
            amount=float(amount),
            account_reference=account_reference,
            description=description
        )

        return Response(result, status=200)

    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def query_mpesa_status(request):
    """
    Query M-PESA transaction status

    POST /api/v1/payments/mpesa/status
    Body: {
        "checkout_request_id": "ws_CO_30122025143045123456789"
    }
    """
    try:
        checkout_request_id = request.data.get('checkout_request_id')

        if not checkout_request_id:
            return Response({
                'success': False,
                'error': 'checkout_request_id required'
            }, status=400)

        result = mpesa_service.query_transaction_status(checkout_request_id)

        return Response(result, status=200)

    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])  # M-PESA callback doesn't send auth
def mpesa_callback(request):
    """
    M-PESA callback/webhook endpoint

    POST /api/v1/payments/mpesa/callback

    This endpoint receives payment confirmation from M-PESA
    """
    try:
        print('[MPESACallback] Received:', request.data)

        result = mpesa_service.process_callback(request.data)

        return Response({
            'ResultCode': 0,
            'ResultDesc': 'Accepted'
        }, status=200)

    except Exception as e:
        print(f'[MPESACallback] Error: {e}')
        return Response({
            'ResultCode': 1,
            'ResultDesc': str(e)
        }, status=200)  # Always return 200 to M-PESA


@api_view(['POST'])
@permission_classes([AllowAny])
def mpesa_timeout(request):
    """
    M-PESA timeout endpoint
    Called when transaction times out (customer doesn't respond)
    """
    try:
        print('[MPESATimeout] Received:', request.data)

        # Mark transaction as timeout in database
        # (Implementation similar to callback)

        return Response({
            'ResultCode': 0,
            'ResultDesc': 'Timeout received'
        }, status=200)

    except Exception as e:
        print(f'[MPESATimeout] Error: {e}')
        return Response({
            'ResultCode': 1,
            'ResultDesc': str(e)
        }, status=200)
```

### Implementation: URL Routing

```python
# app/urls.py (add to existing urlpatterns)

from django.urls import path
from app.views import (
    initiate_mpesa_payment,
    query_mpesa_status,
    mpesa_callback,
    mpesa_timeout
)

urlpatterns = [
    # ... existing patterns ...

    # M-PESA Payments
    path('api/v1/payments/mpesa/initiate', initiate_mpesa_payment, name='mpesa-initiate'),
    path('api/v1/payments/mpesa/status', query_mpesa_status, name='mpesa-status'),
    path('api/v1/payments/mpesa/callback', mpesa_callback, name='mpesa-callback'),
    path('api/v1/payments/mpesa/timeout', mpesa_timeout, name='mpesa-timeout'),
]
```

---

## Frontend Implementation

### Enhanced PaymentService

```javascript
// frontend/services/PaymentService.js (UPDATED)

import DjangoAPIService from "./DjangoAPIService";

class PaymentService {
  constructor() {
    this.api = DjangoAPIService;
  }

  /**
   * Initiate M-PESA STK Push payment
   *
   * @param {string} phoneNumber - Customer phone (0712345678)
   * @param {number} amount - Amount to charge
   * @param {string} accountReference - Quote/Policy number
   * @param {string} description - Transaction description
   * @returns {Promise<Object>} Transaction details with checkout_request_id
   */
  async initiateMpesaPayment(
    phoneNumber,
    amount,
    accountReference,
    description = "Insurance Payment"
  ) {
    try {
      console.log("[PaymentService] Initiating M-PESA:", {
        phoneNumber,
        amount,
        accountReference,
      });

      const response = await this.api.makeRequest(
        "/api/v1/payments/mpesa/initiate",
        {
          method: "POST",
          body: JSON.stringify({
            phone_number: phoneNumber,
            amount: amount,
            account_reference: accountReference,
            description: description,
          }),
        }
      );

      if (!response.success) {
        throw new Error(response.error || "Payment initiation failed");
      }

      return {
        success: true,
        checkout_request_id: response.checkout_request_id,
        merchant_request_id: response.merchant_request_id,
        message:
          response.customer_message || "Check your phone for payment prompt",
      };
    } catch (error) {
      console.error("[PaymentService] M-PESA initiation failed:", error);
      throw error;
    }
  }

  /**
   * Check M-PESA payment status
   *
   * @param {string} checkoutRequestId - CheckoutRequestID from initiation
   * @returns {Promise<Object>} Payment status
   */
  async checkMpesaPaymentStatus(checkoutRequestId) {
    try {
      const response = await this.api.makeRequest(
        "/api/v1/payments/mpesa/status",
        {
          method: "POST",
          body: JSON.stringify({
            checkout_request_id: checkoutRequestId,
          }),
        }
      );

      return {
        status: response.status || "PENDING",
        result_code: response.result_code,
        result_description: response.result_description,
        mpesa_receipt_number: response.mpesa_receipt_number,
      };
    } catch (error) {
      console.error("[PaymentService] Status check failed:", error);
      return { status: "PENDING" };
    }
  }

  /**
   * Poll payment status until completion or timeout
   *
   * @param {string} checkoutRequestId - CheckoutRequestID to poll
   * @param {number} maxAttempts - Maximum polling attempts (default 30)
   * @param {number} interval - Polling interval in ms (default 2000)
   * @returns {Promise<Object>} Final payment result
   */
  async pollPaymentStatus(
    checkoutRequestId,
    maxAttempts = 30,
    interval = 2000
  ) {
    console.log(
      "[PaymentService] Starting payment polling:",
      checkoutRequestId
    );

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`[PaymentService] Poll attempt ${attempt}/${maxAttempts}`);

      const status = await this.checkMpesaPaymentStatus(checkoutRequestId);

      if (status.status === "SUCCESS") {
        console.log(
          "[PaymentService] Payment successful:",
          status.mpesa_receipt_number
        );
        return {
          success: true,
          receipt: status.mpesa_receipt_number,
          result_description: status.result_description,
        };
      }

      if (status.status === "FAILED") {
        console.log(
          "[PaymentService] Payment failed:",
          status.result_description
        );
        return {
          success: false,
          reason: status.result_description || "Payment failed",
        };
      }

      if (status.status === "CANCELLED") {
        console.log("[PaymentService] Payment cancelled by user");
        return {
          success: false,
          reason: "Payment cancelled",
        };
      }

      // Still pending, wait before next attempt
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    // Timeout reached
    console.log("[PaymentService] Payment polling timeout");
    throw new Error("Payment timeout - please check your M-PESA messages");
  }

  /**
   * Mock payment confirmation (for testing/fallback)
   */
  async mockPaymentConfirmation(paymentMethod, amount, reference) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          receipt: `${paymentMethod}-${Date.now()}`,
          amount: amount,
          reference: reference,
          timestamp: new Date().toISOString(),
        });
      }, 2000);
    });
  }

  /**
   * Submit payment confirmation to backend
   */
  async confirmPayment(paymentData) {
    try {
      const response = await this.api.makeAuthenticatedRequest(
        "/payments/confirm",
        "POST",
        paymentData
      );
      return response;
    } catch (error) {
      console.error("[PaymentService] Payment confirmation failed:", error);
      throw error;
    }
  }
}

export default new PaymentService();
```

### Payment Component Integration

```javascript
// frontend/screens/quotations/Motor3/third-party/steps/Step7_Payment.js (UPDATED)

import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet, Alert, ActivityIndicator, Text } from "react-native";
import { useMotor3 } from "../../contexts/Motor3Context";
import { useThirdParty } from "../../contexts/ThirdPartyContext";
import Payment from "../../shared/Payment/Payment/EnhancedPayment";
import StepNavigation from "./StepNavigation";
import Motor3Stepper from "../../components/Motor3Stepper";
import PaymentService from "../../../../../services/PaymentService";

const Step7_Payment = ({ onNext, onBack, currentStep, totalSteps }) => {
  const { setPaymentDetails, clientDetails, selectedSubcategory } = useMotor3();
  const thirdParty = useThirdParty();

  const [paymentMethod, setPaymentMethod] = useState("MPESA");
  const [additionalCoverages, setAdditionalCoverages] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");

  // ... (keep existing selectedProduct, vehicleData, resolvedUnderwriter, displayPremium useMemos) ...

  const handlePaymentMethodChange = useCallback((method) => {
    setPaymentMethod(method);
  }, []);

  const handleCoverageChange = useCallback((coverages) => {
    setAdditionalCoverages(Array.isArray(coverages) ? coverages : []);
  }, []);

  const handleNext = useCallback(async () => {
    if (paymentMethod === "MPESA") {
      // M-PESA payment flow
      setProcessing(true);
      setProcessingMessage("Initiating M-PESA payment...");

      try {
        const phoneNumber =
          clientDetails?.phone || thirdParty.phone || "0712345678";
        const amount =
          displayPremium?.total_premium ??
          resolvedUnderwriter?.total_premium ??
          0;
        const accountReference = `QT-${Date.now()}`;
        const description = `Motor3 Third Party Insurance - ${vehicleData.registrationNumber}`;

        // Step 1: Initiate STK Push
        const initResult = await PaymentService.initiateMpesaPayment(
          phoneNumber,
          amount,
          accountReference,
          description
        );

        if (!initResult.success) {
          throw new Error(initResult.error || "Failed to initiate payment");
        }

        // Show STK Push prompt message
        Alert.alert(
          "Payment Prompt Sent",
          `${initResult.message}\n\nPhone: ${phoneNumber}`,
          [{ text: "OK" }]
        );

        setProcessingMessage("Waiting for payment confirmation...");

        // Step 2: Poll for payment status
        const pollResult = await PaymentService.pollPaymentStatus(
          initResult.checkout_request_id
        );

        if (pollResult.success) {
          // Payment successful
          Alert.alert("Payment Successful", `Receipt: ${pollResult.receipt}`, [
            { text: "OK" },
          ]);

          setPaymentDetails({
            payment_method: "MPESA",
            method: "MPESA",
            amount: amount,
            additional_coverages: additionalCoverages,
            checkout_request_id: initResult.checkout_request_id,
            mpesa_receipt: pollResult.receipt,
            created_at: new Date().toISOString(),
            status: "SUCCESS",
          });

          onNext?.();
        } else {
          // Payment failed
          Alert.alert(
            "Payment Failed",
            pollResult.reason || "Payment was not completed",
            [{ text: "Try Again" }]
          );
        }
      } catch (error) {
        console.error("[Step7_Payment] M-PESA error:", error);
        Alert.alert(
          "Payment Error",
          error.message || "Failed to process M-PESA payment",
          [{ text: "OK" }]
        );
      } finally {
        setProcessing(false);
        setProcessingMessage("");
      }
    } else {
      // DPO or other payment methods
      setPaymentDetails({
        payment_method: paymentMethod,
        method: paymentMethod,
        amount:
          displayPremium?.total_premium ??
          resolvedUnderwriter?.total_premium ??
          0,
        additional_coverages: additionalCoverages,
        created_at: new Date().toISOString(),
      });
      onNext?.();
    }
  }, [
    paymentMethod,
    displayPremium,
    resolvedUnderwriter,
    additionalCoverages,
    clientDetails,
    thirdParty,
    vehicleData,
    setPaymentDetails,
    onNext,
  ]);

  return (
    <View style={styles.container}>
      <Motor3Stepper currentStep={currentStep} totalSteps={totalSteps} />

      {processing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#D5222B" />
          <Text style={styles.processingText}>{processingMessage}</Text>
        </View>
      )}

      <Payment
        selectedProduct={selectedProduct}
        vehicleData={vehicleData}
        premium={displayPremium}
        underwriter={resolvedUnderwriter}
        clientDetails={clientDetails}
        additionalCoverages={additionalCoverages}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={handlePaymentMethodChange}
        onCoverageChange={handleCoverageChange}
      />
      <StepNavigation
        currentStep={currentStep}
        totalSteps={totalSteps}
        onBack={onBack}
        onNext={handleNext}
        disableNext={processing}
      />
    </View>
  );
};

export default Step7_Payment;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  processingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  processingText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
});
```

---

## Testing Strategy

### Phase 1: Backend Unit Tests

```python
# insurance-app/app/tests/test_mpesa_integration.py

from django.test import TestCase
from app.services.mpesa_service import mpesa_service
from app.models import MPESATransaction


class MPESAIntegrationTestCase(TestCase):
    """Test M-PESA integration functionality"""

    def test_phone_normalization(self):
        """Test phone number normalization"""
        test_cases = [
            ('0712345678', '254712345678'),
            ('712345678', '254712345678'),
            ('+254712345678', '254712345678'),
            ('254712345678', '254712345678'),
        ]

        for input_phone, expected in test_cases:
            normalized = mpesa_service._normalize_phone(input_phone)
            self.assertEqual(normalized, expected)

    def test_password_generation(self):
        """Test M-PESA password generation"""
        timestamp = '20251230143045'
        password = mpesa_service.generate_password(timestamp)

        # Password should be base64 encoded
        self.assertIsNotNone(password)
        self.assertGreater(len(password), 0)

    def test_stk_push_sandbox(self):
        """Test STK Push in sandbox (requires sandbox setup)"""
        # Skip in CI/CD
        if not mpesa_service.is_sandbox:
            self.skipTest('Sandbox not configured')

        result = mpesa_service.initiate_stk_push(
            phone_number='254708374149',  # Sandbox test number
            amount=1,
            account_reference='TEST-001',
            description='Test Payment'
        )

        self.assertTrue(result['success'])
        self.assertIn('checkout_request_id', result)

        # Verify transaction was saved
        transaction = MPESATransaction.objects.get(
            checkout_request_id=result['checkout_request_id']
        )
        self.assertEqual(transaction.status, 'PENDING')
```

### Phase 2: Frontend Component Tests

```javascript
// frontend/__tests__/PaymentService.test.js

import PaymentService from "../services/PaymentService";

describe("PaymentService", () => {
  test("initiateMpesaPayment should return checkout_request_id", async () => {
    const result = await PaymentService.initiateMpesaPayment(
      "0712345678",
      3029.88,
      "TEST-001",
      "Test Insurance Payment"
    );

    expect(result.success).toBe(true);
    expect(result.checkout_request_id).toBeDefined();
  });

  test("pollPaymentStatus should timeout after max attempts", async () => {
    const mockCheckoutId = "ws_CO_MOCK_123";

    await expect(
      PaymentService.pollPaymentStatus(mockCheckoutId, 3, 500)
    ).rejects.toThrow("Payment timeout");
  });
});
```

### Phase 3: End-to-End Testing

```bash
# Test flow checklist:
1. ✓ Start Motor3 Third Party flow
2. ✓ Fill vehicle details
3. ✓ Select underwriter (Madison, KSh 3,029.88)
4. ✓ Fill client details with phone number
5. ✓ Reach payment step
6. ✓ Select M-PESA payment method
7. ✓ Click Next → STK Push initiated
8. ✓ Check phone for payment prompt
9. ✓ Enter M-PESA PIN
10. ✓ Wait for confirmation (should appear within 10 seconds)
11. ✓ Verify quote status updated to ACTIVE
12. ✓ Check database for MPESATransaction record
```

---

## Production Deployment

### Checklist

- [ ] **Request Production Credentials from Safaricom**

  - Contact Safaricom business support
  - Provide company registration documents
  - Request production shortcode and passkey
  - Complete Go-Live approval process

- [ ] **Update Environment Variables**

  ```env
  MPESA_ENVIRONMENT=production
  MPESA_CONSUMER_KEY={production_key}
  MPESA_CONSUMER_SECRET={production_secret}
  MPESA_SHORTCODE={production_shortcode}
  MPESA_PASSKEY={production_passkey}
  ```

- [ ] **Configure Production Callback URLs**

  - Update Daraja app settings with production URLs
  - Ensure HTTPS is enabled (required by M-PESA)
  - Test callback endpoint is publicly accessible

- [ ] **Enable Monitoring**

  - Set up transaction logging
  - Configure Sentry for error tracking
  - Set up alerts for failed payments

- [ ] **Run Production Tests**
  - Test with real Ksh 1 transaction
  - Verify callback processing
  - Test timeout scenarios
  - Validate reconciliation reports

---

## Security Considerations

### 1. **Credentials Management**

```python
# NEVER commit credentials to git
# Use environment variables only
# Rotate credentials every 3 months
```

### 2. **Callback Endpoint Security**

```python
# app/views.py

from django.views.decorators.csrf import csrf_exempt

@csrf_exempt  # M-PESA callback can't send CSRF token
@api_view(['POST'])
def mpesa_callback(request):
    # Verify callback came from M-PESA IP addresses
    allowed_ips = [
        '196.201.214.0/24',  # Safaricom IP range
        '196.201.213.0/24'
    ]

    client_ip = request.META.get('REMOTE_ADDR')
    # Validate IP...
```

### 3. **Data Encryption**

```python
# Encrypt sensitive data at rest
from cryptography.fernet import Fernet

# Store encrypted phone numbers and amounts
encrypted_phone = fernet.encrypt(phone.encode())
```

### 4. **Rate Limiting**

```python
# Prevent payment spam
from django.core.cache import cache

def rate_limit_payment(phone_number):
    key = f'payment_limit_{phone_number}'
    count = cache.get(key, 0)

    if count >= 5:  # Max 5 payments per hour
        raise Exception('Payment rate limit exceeded')

    cache.set(key, count + 1, 3600)
```

---

## Troubleshooting

### Common Errors

#### 1. **"Invalid Access Token"**

```
Solution: Access tokens expire after 1 hour
- Regenerate token before each API call
- Don't cache tokens longer than 50 minutes
```

#### 2. **"Wrong credentials"**

```
Solution: Verify consumer key and secret
- Check environment (sandbox vs production)
- Ensure credentials match selected environment
- Re-encode credentials in Base64
```

#### 3. **"The initiator information is invalid"**

```
Solution: Check shortcode and passkey combination
- Sandbox: Use 174379 + provided passkey
- Production: Use your assigned shortcode
```

#### 4. **Callback not received**

```
Solution: Verify callback URL accessibility
- Must be publicly accessible (no localhost)
- Must be HTTPS in production
- Check firewall/security group rules
- Test with Postman/curl
```

#### 5. **STK Push timeout**

```
Solution: User didn't complete payment
- Show clear instructions to user
- Implement retry mechanism
- Save transaction for manual verification
```

### Debug Logging

```python
# Add comprehensive logging
import logging

logger = logging.getLogger(__name__)

def initiate_stk_push(self, ...):
    logger.info(f'Initiating STK Push: phone={phone}, amount={amount}')

    try:
        response = requests.post(...)
        logger.info(f'M-PESA Response: {response.json()}')
    except Exception as e:
        logger.error(f'STK Push failed: {str(e)}', exc_info=True)
```

---

## Next Steps

### Immediate (Week 1)

1. ✅ Read this documentation
2. ⏳ Register Daraja sandbox account
3. ⏳ Create backend MPESAService class
4. ⏳ Add database migration for MPESATransaction model
5. ⏳ Test sandbox STK Push with Postman

### Short-term (Week 2-3)

6. ⏳ Implement frontend PaymentService enhancements
7. ⏳ Integrate M-PESA in Motor3 payment step
8. ⏳ Test end-to-end sandbox flow
9. ⏳ Add error handling and retry logic
10. ⏳ Implement payment status polling

### Medium-term (Week 4-6)

11. ⏳ Apply for production credentials
12. ⏳ Set up production callback URLs
13. ⏳ Conduct production smoke tests
14. ⏳ Deploy to EC2 production
15. ⏳ Monitor real transactions

---

## Support Resources

- **Daraja Portal**: https://developer.safaricom.co.ke/
- **API Documentation**: https://developer.safaricom.co.ke/docs
- **Community Forum**: https://developer.safaricom.co.ke/community
- **Support Email**: apisupport@safaricom.co.ke
- **Test Credentials**: Available in Daraja sandbox dashboard

---

## Appendix

### A. Sample Postman Collection

```json
{
  "info": {
    "name": "M-PESA Daraja API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "OAuth Token",
      "request": {
        "method": "GET",
        "url": "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
        "header": [
          {
            "key": "Authorization",
            "value": "Basic {{base64_credentials}}"
          }
        ]
      }
    },
    {
      "name": "STK Push",
      "request": {
        "method": "POST",
        "url": "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{access_token}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"BusinessShortCode\": \"174379\",\n  \"Password\": \"{{password}}\",\n  \"Timestamp\": \"{{timestamp}}\",\n  \"TransactionType\": \"CustomerPayBillOnline\",\n  \"Amount\": \"1\",\n  \"PartyA\": \"254708374149\",\n  \"PartyB\": \"174379\",\n  \"PhoneNumber\": \"254708374149\",\n  \"CallBackURL\": \"https://yourdomain.com/callback\",\n  \"AccountReference\": \"TEST-001\",\n  \"TransactionDesc\": \"Test Payment\"\n}"
        }
      }
    }
  ]
}
```

### B. Environment Variables Template

```env
# .env.example
# Copy to .env and fill in your credentials

# M-PESA Sandbox
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_CALLBACK_URL=https://your-domain.com/api/v1/public_app/payments/webhook
MPESA_TIMEOUT_URL=https://your-domain.com/api/v1/payments/mpesa/timeout

# M-PESA Production (fill when ready)
MPESA_PROD_CONSUMER_KEY=
MPESA_PROD_CONSUMER_SECRET=
MPESA_PROD_SHORTCODE=
MPESA_PROD_PASSKEY=
```

---

**End of Document**

For questions or assistance, contact:

- **Developer**: GitHub Copilot
- **Date**: December 30, 2025
- **Version**: 1.0.0
