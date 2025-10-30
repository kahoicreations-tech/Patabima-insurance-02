# Motor 2 Insurance Policy Application - Final Completion Prompt

## Date: October 1, 2025

## Status: Payment Screen Complete → Need Policy Submission Implementation

---

## 📋 Current State Overview

### ✅ Completed Components (Steps 1-6)

1. **Category Selection** ✅

   - Backend categories loaded dynamically
   - Private, Commercial, PSV, Motorcycle, TukTuk, Special Classes
   - Proper error handling and loading states

2. **Subcategory Selection** ✅

   - Cover types displayed per category
   - TOR, Third Party, Third Party Extendible, Comprehensive
   - Dynamic form requirements based on coverage type

3. **Vehicle Details** ✅

   - Dynamic form generation based on subcategory
   - Category-specific fields (tonnage, passenger capacity, engine capacity)
   - Sum insured for comprehensive coverage
   - Vehicle accessories values (windscreen, radio, accessories)

4. **Documents Upload** ✅

   - AWS Textract integration working
   - Logbook, ID Copy, KRA PIN document extraction
   - Real-time OCR processing via Lambda
   - Document canonicalization with Kenya-specific regex
   - S3 storage with presigned URLs

5. **Client Details** ✅

   - Enhanced client form with extraction auto-fill
   - First Name, Last Name, KRA PIN
   - Vehicle Registration, Chassis Number, Make, Model
   - Document extraction data flows correctly to form fields

6. **Payment Screen** ✅
   - Vehicle details display
   - Policy summary with correct levy calculations
   - Premium breakdown (Base + IRA Levy 0.25% + Training Levy 0.25% + Stamp Duty KSh 40)
   - Underwriter-specific add-ons selection
   - Payment method selection (M-PESA, Bank Transfer, Card Payment)
   - Total amount calculation

### ❌ Missing Final Step: Policy Submission & Confirmation

**Step 7: Submission** - NOT IMPLEMENTED

---

## 🎯 Implementation Requirements

### Phase 1: Payment Processing Integration

#### A. M-PESA STK Push Implementation

**Required Backend Endpoint:**

```python
# insurance-app/app/views_payments.py (NEW FILE)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
import requests
import base64
from datetime import datetime

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_mpesa_payment(request):
    """
    Initiate M-PESA STK Push
    POST /api/payments/mpesa/stk-push
    Body: {
        "phone_number": "+254712345678",
        "amount": 3029.88,
        "account_reference": "QUOTE-12345",
        "description": "Motor Insurance Premium"
    }
    """
    phone = request.data.get('phone_number', '').strip()
    amount = int(float(request.data.get('amount', 0)))
    reference = request.data.get('account_reference')
    description = request.data.get('description', 'Insurance Payment')

    # Format phone number (remove +254, add 254)
    if phone.startswith('+254'):
        phone = phone[1:]
    elif phone.startswith('0'):
        phone = '254' + phone[1:]

    # M-PESA API credentials from settings
    consumer_key = settings.MPESA_CONSUMER_KEY
    consumer_secret = settings.MPESA_CONSUMER_SECRET
    shortcode = settings.MPESA_SHORTCODE
    passkey = settings.MPESA_PASSKEY
    callback_url = settings.MPESA_CALLBACK_URL

    # Generate access token
    auth_url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    response = requests.get(auth_url, auth=(consumer_key, consumer_secret))
    access_token = response.json().get('access_token')

    # Generate password
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    password = base64.b64encode(f"{shortcode}{passkey}{timestamp}".encode()).decode()

    # STK Push request
    stk_url = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
    headers = {'Authorization': f'Bearer {access_token}'}
    payload = {
        "BusinessShortCode": shortcode,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": amount,
        "PartyA": phone,
        "PartyB": shortcode,
        "PhoneNumber": phone,
        "CallBackURL": callback_url,
        "AccountReference": reference,
        "TransactionDesc": description
    }

    stk_response = requests.post(stk_url, json=payload, headers=headers)

    if stk_response.status_code == 200:
        data = stk_response.json()
        # Save transaction to database
        from .models import MpesaTransaction
        MpesaTransaction.objects.create(
            checkout_request_id=data.get('CheckoutRequestID'),
            merchant_request_id=data.get('MerchantRequestID'),
            phone_number=phone,
            amount=amount,
            account_reference=reference,
            status='PENDING'
        )
        return Response({
            'success': True,
            'message': 'STK Push sent successfully',
            'checkout_request_id': data.get('CheckoutRequestID')
        })

    return Response({
        'success': False,
        'error': 'Failed to initiate payment'
    }, status=400)


@api_view(['POST'])
def mpesa_callback(request):
    """
    M-PESA callback endpoint
    POST /api/payments/mpesa/callback
    """
    data = request.data
    result_code = data.get('Body', {}).get('stkCallback', {}).get('ResultCode')
    checkout_request_id = data.get('Body', {}).get('stkCallback', {}).get('CheckoutRequestID')

    from .models import MpesaTransaction
    transaction = MpesaTransaction.objects.filter(
        checkout_request_id=checkout_request_id
    ).first()

    if transaction:
        if result_code == 0:
            # Payment successful
            transaction.status = 'COMPLETED'
            transaction.mpesa_receipt_number = data.get('Body', {}).get('stkCallback', {}).get('CallbackMetadata', {}).get('Item', [{}])[0].get('Value')
            transaction.save()
        else:
            # Payment failed
            transaction.status = 'FAILED'
            transaction.save()

    return Response({'ResultCode': 0, 'ResultDesc': 'Accepted'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_payment_status(request, checkout_request_id):
    """
    Check M-PESA payment status
    GET /api/payments/mpesa/status/<checkout_request_id>
    """
    from .models import MpesaTransaction
    transaction = MpesaTransaction.objects.filter(
        checkout_request_id=checkout_request_id
    ).first()

    if not transaction:
        return Response({'error': 'Transaction not found'}, status=404)

    return Response({
        'status': transaction.status,
        'amount': transaction.amount,
        'phone_number': transaction.phone_number,
        'mpesa_receipt': transaction.mpesa_receipt_number,
        'created_at': transaction.created_at
    })
```

**Required Model:**

```python
# insurance-app/app/models.py (ADD THIS MODEL)

class MpesaTransaction(models.Model):
    checkout_request_id = models.CharField(max_length=100, unique=True)
    merchant_request_id = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    account_reference = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=[
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed')
    ], default='PENDING')
    mpesa_receipt_number = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'mpesa_transactions'
```

**Frontend Implementation:**

```javascript
// frontend/services/PaymentService.js (NEW FILE)

import DjangoAPIService from "./DjangoAPIService";

class PaymentService {
  constructor() {
    this.api = DjangoAPIService;
  }

  /**
   * Initiate M-PESA STK Push
   */
  async initiateMpesaPayment(
    phoneNumber,
    amount,
    accountReference,
    description
  ) {
    try {
      const response = await this.api.makeAuthenticatedRequest(
        "/payments/mpesa/stk-push",
        "POST",
        {
          phone_number: phoneNumber,
          amount: amount,
          account_reference: accountReference,
          description: description,
        }
      );
      return response;
    } catch (error) {
      console.error("M-PESA payment initiation failed:", error);
      throw error;
    }
  }

  /**
   * Check M-PESA payment status
   */
  async checkMpesaPaymentStatus(checkoutRequestId) {
    try {
      const response = await this.api.makeAuthenticatedRequest(
        `/payments/mpesa/status/${checkoutRequestId}`,
        "GET"
      );
      return response;
    } catch (error) {
      console.error("Payment status check failed:", error);
      throw error;
    }
  }

  /**
   * Poll payment status every 5 seconds
   */
  async pollPaymentStatus(checkoutRequestId, maxAttempts = 24) {
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        attempts++;

        try {
          const status = await this.checkMpesaPaymentStatus(checkoutRequestId);

          if (status.status === "COMPLETED") {
            clearInterval(interval);
            resolve(status);
          } else if (status.status === "FAILED") {
            clearInterval(interval);
            reject(new Error("Payment failed"));
          } else if (attempts >= maxAttempts) {
            clearInterval(interval);
            reject(new Error("Payment timeout"));
          }
        } catch (error) {
          if (attempts >= maxAttempts) {
            clearInterval(interval);
            reject(error);
          }
        }
      }, 5000); // Check every 5 seconds
    });
  }
}

export default new PaymentService();
```

**Payment Screen Component Update:**

```javascript
// frontend/screens/quotations/Motor 2/MotorInsuranceFlow/Payment/EnhancedPayment.js

import React, { useState } from 'react';
import { TextInput, Alert } from 'react-native';
import PaymentService from '../../../../../services/PaymentService';

export default function EnhancedPayment({ ... }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleMpesaPayment = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Validation', 'Please enter a valid phone number');
      return;
    }

    setIsProcessingPayment(true);

    try {
      // 1. Initiate STK Push
      const stkResponse = await PaymentService.initiateMpesaPayment(
        phoneNumber,
        premium.totalPremium,
        `MOTOR-${Date.now()}`,
        'Motor Insurance Premium Payment'
      );

      if (!stkResponse.success) {
        throw new Error(stkResponse.error || 'Failed to initiate payment');
      }

      Alert.alert(
        'Payment Initiated',
        'Please check your phone and enter your M-PESA PIN to complete the payment.'
      );

      // 2. Poll for payment status
      const paymentStatus = await PaymentService.pollPaymentStatus(
        stkResponse.checkout_request_id
      );

      if (paymentStatus.status === 'COMPLETED') {
        Alert.alert('Success', 'Payment completed successfully!');
        // Pass payment details to next step
        onPaymentConfirmed?.({
          method: 'MPESA',
          receipt: paymentStatus.mpesa_receipt,
          amount: paymentStatus.amount,
          phone: paymentStatus.phone_number
        });
      }
    } catch (error) {
      Alert.alert('Payment Failed', error.message || 'An error occurred during payment');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <ScrollView>
      {/* ... existing code ... */}

      {/* M-PESA Phone Number Input */}
      {paymentMethod === 'MPESA' && (
        <View style={styles.phoneInputContainer}>
          <Text style={styles.label}>M-PESA Phone Number</Text>
          <TextInput
            style={styles.phoneInput}
            placeholder="+254712345678"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            maxLength={13}
          />
          <TouchableOpacity
            style={[styles.payButton, isProcessingPayment && styles.payButtonDisabled]}
            onPress={handleMpesaPayment}
            disabled={isProcessingPayment}
          >
            <Text style={styles.payButtonText}>
              {isProcessingPayment ? 'Processing...' : 'Pay with M-PESA'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
```

---

### Phase 2: Policy Submission to Backend

**Required Backend Endpoint:**

```python
# insurance-app/app/views_policies.py (NEW OR UPDATE)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_motor_policy(request):
    """
    Create motor insurance policy
    POST /api/policies/motor/create
    Body: {
        "quote_id": "quote-uuid",
        "client_details": {...},
        "vehicle_details": {...},
        "product_details": {...},
        "underwriter_details": {...},
        "premium_breakdown": {...},
        "payment_details": {...},
        "documents": {...}
    }
    """
    try:
        data = request.data

        # 1. Validate payment
        payment = data.get('payment_details', {})
        if payment.get('method') == 'MPESA':
            from .models import MpesaTransaction
            transaction = MpesaTransaction.objects.filter(
                mpesa_receipt_number=payment.get('receipt')
            ).first()
            if not transaction or transaction.status != 'COMPLETED':
                return Response({
                    'success': False,
                    'error': 'Payment not confirmed'
                }, status=400)

        # 2. Generate policy number
        policy_number = generate_policy_number()  # e.g., POL-2025-001234

        # 3. Create policy record
        from .models import MotorInsurancePolicy
        policy = MotorInsurancePolicy.objects.create(
            policy_number=policy_number,
            agent=request.user,
            client_name=f"{data['client_details']['first_name']} {data['client_details']['last_name']}",
            client_kra_pin=data['client_details'].get('kra_pin'),
            vehicle_registration=data['vehicle_details']['registration'],
            vehicle_make=data['vehicle_details'].get('make'),
            vehicle_model=data['vehicle_details'].get('model'),
            chassis_number=data['vehicle_details'].get('chassis_number'),
            product_category=data['product_details']['category'],
            product_name=data['product_details']['name'],
            coverage_type=data['product_details']['coverage_type'],
            underwriter_name=data['underwriter_details']['name'],
            premium_amount=data['premium_breakdown']['base_premium'],
            total_premium=data['premium_breakdown']['total_premium'],
            cover_start_date=data['vehicle_details']['cover_start_date'],
            cover_end_date=calculate_end_date(data['vehicle_details']['cover_start_date']),
            payment_method=payment['method'],
            payment_reference=payment.get('receipt'),
            status='ACTIVE',
            documents=data.get('documents', {})
        )

        # 4. Generate policy PDF
        pdf_url = generate_policy_pdf(policy)

        # 5. Send notifications
        send_policy_email(policy, pdf_url)
        send_policy_sms(policy)

        # 6. Calculate agent commission
        calculate_commission(policy, request.user)

        return Response({
            'success': True,
            'policy_number': policy_number,
            'policy_id': policy.id,
            'pdf_url': pdf_url,
            'message': 'Policy created successfully'
        })

    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


def generate_policy_number():
    """Generate unique policy number"""
    from .models import MotorInsurancePolicy
    from datetime import datetime

    year = datetime.now().year
    last_policy = MotorInsurancePolicy.objects.filter(
        policy_number__startswith=f'POL-{year}'
    ).order_by('-created_at').first()

    if last_policy:
        last_number = int(last_policy.policy_number.split('-')[-1])
        new_number = last_number + 1
    else:
        new_number = 1

    return f'POL-{year}-{new_number:06d}'


def generate_policy_pdf(policy):
    """Generate policy PDF and upload to S3"""
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    import boto3
    from io import BytesIO

    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)

    # PDF content
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(100, 750, "MOTOR INSURANCE POLICY")
    pdf.setFont("Helvetica", 12)
    pdf.drawString(100, 720, f"Policy Number: {policy.policy_number}")
    pdf.drawString(100, 700, f"Client: {policy.client_name}")
    pdf.drawString(100, 680, f"Vehicle: {policy.vehicle_registration}")
    pdf.drawString(100, 660, f"Cover Type: {policy.coverage_type}")
    pdf.drawString(100, 640, f"Underwriter: {policy.underwriter_name}")
    pdf.drawString(100, 620, f"Premium: KSh {policy.total_premium:,.2f}")
    pdf.drawString(100, 600, f"Cover Period: {policy.cover_start_date} to {policy.cover_end_date}")

    pdf.save()

    # Upload to S3
    buffer.seek(0)
    s3 = boto3.client('s3')
    s3_key = f'policies/{policy.policy_number}.pdf'
    s3.put_object(
        Bucket=settings.S3_BUCKET,
        Key=s3_key,
        Body=buffer.getvalue(),
        ContentType='application/pdf'
    )

    return f"https://{settings.S3_BUCKET}.s3.amazonaws.com/{s3_key}"
```

**Frontend Submission Component:**

```javascript
// frontend/screens/quotations/Motor 2/MotorInsuranceFlow/Submission/PolicySubmission.js (NEW FILE)

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import DjangoAPIService from "../../../../../services/DjangoAPIService";

export default function PolicySubmission({
  quoteId,
  clientDetails,
  vehicleDetails,
  productDetails,
  underwriterDetails,
  premiumBreakdown,
  paymentDetails,
  documents,
  onSubmissionComplete,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState("Preparing policy data...");

  useEffect(() => {
    submitPolicy();
  }, []);

  const submitPolicy = async () => {
    setSubmitting(true);

    try {
      // Step 1: Prepare data
      setProgress("Preparing policy data...");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 2: Submit to backend
      setProgress("Submitting to backend...");
      const response = await DjangoAPIService.makeAuthenticatedRequest(
        "/policies/motor/create",
        "POST",
        {
          quote_id: quoteId,
          client_details: clientDetails,
          vehicle_details: vehicleDetails,
          product_details: productDetails,
          underwriter_details: underwriterDetails,
          premium_breakdown: premiumBreakdown,
          payment_details: paymentDetails,
          documents: documents,
        }
      );

      if (!response.success) {
        throw new Error(response.error || "Policy creation failed");
      }

      // Step 3: Generate PDF
      setProgress("Generating policy document...");
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Step 4: Send notifications
      setProgress("Sending notifications...");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 5: Complete
      setProgress("Policy created successfully!");

      setTimeout(() => {
        onSubmissionComplete?.({
          policyNumber: response.policy_number,
          policyId: response.policy_id,
          pdfUrl: response.pdf_url,
        });
      }, 1000);
    } catch (error) {
      setSubmitting(false);
      Alert.alert(
        "Submission Failed",
        error.message || "Failed to create policy. Please try again.",
        [
          { text: "Retry", onPress: submitPolicy },
          { text: "Cancel", style: "cancel" },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#D5222B" />
      <Text style={styles.progressText}>{progress}</Text>
      {submitting && <Text style={styles.pleaseWait}>Please wait...</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  progressText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginTop: 20,
    textAlign: "center",
  },
  pleaseWait: {
    fontSize: 14,
    color: "#6c757d",
    marginTop: 10,
  },
});
```

---

### Phase 3: Success Screen

**Success Screen Component:**

```javascript
// frontend/screens/quotations/Motor 2/MotorInsuranceFlow/Success/PolicySuccess.js (NEW FILE)

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Share } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function PolicySuccess({ route }) {
  const navigation = useNavigation();
  const { policyNumber, policyId, pdfUrl } = route.params || {};

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Your motor insurance policy ${policyNumber} has been created successfully!`,
        url: pdfUrl,
      });
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const handleDownloadPDF = () => {
    // Open PDF in browser or download
    // Linking.openURL(pdfUrl);
  };

  const handleBackToHome = () => {
    navigation.navigate("Home");
  };

  return (
    <View style={styles.container}>
      <View style={styles.successCard}>
        <Text style={styles.checkmark}>✓</Text>
        <Text style={styles.title}>Policy Created Successfully!</Text>
        <Text style={styles.policyNumber}>Policy Number: {policyNumber}</Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Your motor insurance policy has been created and activated.
          </Text>
          <Text style={styles.infoText}>
            A copy of your policy document has been sent to your email.
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleDownloadPDF}
          >
            <Text style={styles.primaryButtonText}>Download Policy PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleShare}
          >
            <Text style={styles.secondaryButtonText}>Share Policy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tertiaryButton}
            onPress={handleBackToHome}
          >
            <Text style={styles.tertiaryButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  successCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  checkmark: {
    fontSize: 64,
    color: "#28a745",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 10,
    textAlign: "center",
  },
  policyNumber: {
    fontSize: 18,
    fontWeight: "600",
    color: "#D5222B",
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: "#e7f3ff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
  },
  infoText: {
    fontSize: 14,
    color: "#495057",
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 8,
  },
  actionsContainer: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#D5222B",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#D5222B",
  },
  secondaryButtonText: {
    color: "#D5222B",
    fontSize: 16,
    fontWeight: "600",
  },
  tertiaryButton: {
    paddingVertical: 14,
    alignItems: "center",
  },
  tertiaryButtonText: {
    color: "#6c757d",
    fontSize: 16,
    fontWeight: "600",
  },
});
```

---

### Phase 4: Update Motor Insurance Screen (Step 6/7)

**Update MotorInsuranceScreen.js:**

```javascript
// In MotorInsuranceScreen.js

// Step 6/7: Submission
const submissionStep = isComprehensive ? 7 : 6;

if (step === submissionStep) {
  return (
    <PolicySubmission
      quoteId={state.quoteId}
      clientDetails={{
        first_name: state.pricingInputs.first_name,
        last_name: state.pricingInputs.last_name,
        kra_pin: state.pricingInputs.kra_pin,
      }}
      vehicleDetails={{
        registration: state.pricingInputs.vehicle_registration,
        chassis_number: state.pricingInputs.chassis_number,
        make: state.pricingInputs.vehicle_make,
        model: state.pricingInputs.vehicle_model,
        cover_start_date: state.vehicleDetails.cover_start_date,
        ...state.vehicleDetails,
      }}
      productDetails={{
        category: state.selectedCategory?.title,
        name: state.selectedSubcategory?.name,
        coverage_type: state.selectedSubcategory?.coverage_type,
      }}
      underwriterDetails={{
        name: state.selectedUnderwriter?.name,
        company: state.selectedUnderwriter?.company_name,
      }}
      premiumBreakdown={{
        base_premium: state.calculatedPremium?.base_premium,
        total_premium: state.calculatedPremium?.totalPremium,
        training_levy: state.calculatedPremium?.training_levy,
        pcf_levy: state.calculatedPremium?.pcf_levy,
        stamp_duty: state.calculatedPremium?.stamp_duty,
      }}
      paymentDetails={state.paymentConfirmation}
      documents={state.pricingInputs.documents}
      onSubmissionComplete={(policyData) => {
        navigation.navigate("PolicySuccess", policyData);
      }}
    />
  );
}
```

---

## 🚀 Implementation Steps

### Step 1: Backend Setup (2-3 hours)

1. Create `MpesaTransaction` model and migrate
2. Add M-PESA API credentials to settings
3. Implement payment endpoints (`stk-push`, `callback`, `status`)
4. Create policy model if not exists
5. Implement policy creation endpoint
6. Add PDF generation function
7. Set up email/SMS notification functions

### Step 2: Frontend Services (1-2 hours)

1. Create `PaymentService.js`
2. Update `DjangoAPIService` with payment endpoints
3. Test M-PESA integration with sandbox

### Step 3: Payment Screen Enhancement (2-3 hours)

1. Add phone number input for M-PESA
2. Implement STK Push initiation
3. Add payment status polling
4. Show loading states and progress
5. Handle errors gracefully

### Step 4: Submission Flow (2-3 hours)

1. Create `PolicySubmission.js` component
2. Implement data collection from all previous steps
3. Add submission progress indicators
4. Handle submission errors with retry

### Step 5: Success Screen (1 hour)

1. Create `PolicySuccess.js` component
2. Display policy number and details
3. Add PDF download functionality
4. Add share functionality
5. Navigation back to home

### Step 6: Integration Testing (2-3 hours)

1. Test complete flow end-to-end
2. Test M-PESA sandbox payment
3. Test policy creation
4. Test PDF generation
5. Test notifications
6. Test error scenarios

---

## 📋 Testing Checklist

### Payment Testing:

- [ ] M-PESA phone number validation
- [ ] STK Push initiation works
- [ ] Payment status polling works
- [ ] Payment success flow complete
- [ ] Payment failure handling works
- [ ] Payment timeout handling works

### Submission Testing:

- [ ] All data collected correctly from previous steps
- [ ] Policy number generated uniquely
- [ ] Policy record created in database
- [ ] PDF generated correctly
- [ ] Email notification sent
- [ ] SMS notification sent (if implemented)

### Integration Testing:

- [ ] Complete flow from category → success
- [ ] Document extraction → auto-fill → submission
- [ ] Premium calculation → payment → policy creation
- [ ] Error handling at each step
- [ ] Back button navigation works
- [ ] State persistence works

---

## 🎯 Success Criteria

✅ **Payment Processing:**

- M-PESA STK Push working
- Payment status tracked
- Payment confirmation received

✅ **Policy Creation:**

- Policy number generated
- Policy saved to database
- All details captured correctly

✅ **Notifications:**

- Email sent with policy PDF
- SMS confirmation sent (optional)

✅ **User Experience:**

- Loading states shown
- Progress indicators clear
- Error messages helpful
- Success feedback clear
- PDF downloadable

---

## 📁 Files to Create/Update

### New Files:

1. `insurance-app/app/views_payments.py`
2. `insurance-app/app/models.py` (add MpesaTransaction)
3. `frontend/services/PaymentService.js`
4. `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/Submission/PolicySubmission.js`
5. `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/Success/PolicySuccess.js`

### Files to Update:

1. `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/Payment/EnhancedPayment.js`
2. `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/MotorInsuranceScreen.js`
3. `insurance-app/app/urls.py` (add payment routes)
4. `insurance-app/settings.py` (add M-PESA credentials)

---

## 🔧 Environment Variables

Add to `insurance-app/.env`:

```env
# M-PESA Configuration (Sandbox)
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/callback

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
EMAIL_USE_TLS=True

# SMS Configuration (Optional)
SMS_API_KEY=your_sms_api_key
SMS_SENDER_ID=PATABIMA
```

---

## 🎉 Expected Final Result

When complete, users should be able to:

1. Select insurance category and product ✅
2. Enter vehicle details ✅
3. Upload and extract documents ✅
4. View auto-filled client details ✅
5. Review policy summary and pricing ✅
6. **Select payment method**
7. **Pay via M-PESA/Bank/Card**
8. **Receive policy confirmation**
9. **Download policy PDF**
10. **Share policy details**

---

## 💡 Notes

- Use M-PESA sandbox for testing (https://developer.safaricom.co.ke)
- PDF generation can use reportlab or wkhtmltopdf
- Email notifications can use Django's built-in email
- SMS can integrate with Africa's Talking or similar
- Consider adding WhatsApp notifications for better UX
- Store all policies in S3 for backup
- Log all transactions for audit trail

---

**Priority**: HIGH  
**Estimated Time**: 10-15 hours total  
**Complexity**: Medium-High  
**Dependencies**: M-PESA API access, Email setup, S3 configuration

---

**Ready to implement?** Start with Phase 1 (Payment Processing) and work sequentially through each phase.
