# Motor3 Post-Payment Implementation Plan

**Complete Insurance Flow: Payment → Certificate → Receipt → Policy Document**

**Status**: Draft for Review  
**Date**: December 30, 2025  
**Based on**: DMVIC API Documentation (docs/getpdf.jpg, docs/insurance.jpg, docs/validate.jpg)

---

## Executive Summary

This plan completes the Motor3 insurance flow post-payment, focusing on:

1. **DMVIC Certificate Generation** (Mandatory - Blocks policy activation)
2. **Receipt/Invoice Generation** (Payment confirmation document)
3. **Policy Document Generation** (Complete policy details PDF)
4. **SMS/Email Notifications** (Client & Agent alerts)
5. **Success Screen** (Download options, policy summary)

**Current State**: Payment integration complete (M-PESA, Manual) with sandbox auto-success  
**Target State**: Full end-to-end flow from quotation → payment → certificate → documents → client notification

---

## Architecture Overview

### Backend Architecture (Already Exists)

```
insurance-app/
├── app/
│   ├── models.py
│   │   └── MotorPolicy (policy_number, status, certificate_url, receipt_url, policy_document_url)
│   ├── services/
│   │   ├── dmvic_service.py (DMVIC API integration)
│   │   ├── dmvic_certificate_manager.py (Certificate lifecycle with retries)
│   │   └── dmvic_field_mapper.py (Policy → DMVIC payload mapping)
│   └── views/
│       └── dmvic_views.py (Certificate issuance endpoints)
```

**Key Backend Features Already Implemented**:

- ✅ `DMVICService`: DMVIC API client with authentication
- ✅ `DMVICCertificateManager`: Synchronous certificate issuance with 3 retries (5s, 15s, 30s delays)
- ✅ `MotorPolicy.activate_policy()`: Policy activation method
- ✅ DMVIC certificate fields in MotorPolicy model
- ✅ Payment confirmation handling

### DMVIC API Endpoints (Based on Documentation)

#### 4.5 GET CERTIFICATE PDF

```
POST /api/V1/Certificate/GetCertificate
Headers:
  - Authorization: Bearer {token}
  - ClientID: {uuid}

Request Body:
{
  "certificateNumber": "A1020701"  # From issue-certificate response
}

Response:
{
  "heads": null,
  "Success": true,
  "Certificate_number": "A1020701",
  "ErrorDescription": null,
  "urlResult": "URL"  # Direct PDF URL or base64 encoded PDF
}
```

**Usage**: Download certificate PDF after issuance

#### 4.4 ISSUE CERTIFICATE (Type A/B)

```
POST /api/V1/Certificate/IssueType{A|B}Certificate
Headers:
  - Authorization: Bearer {token}
  - ClientID: {uuid}

Request Body: (See docs/insurance.jpg for complete schema)
{
  "Vehicle_Registration": "KDB016H",
  "InsuranceCompany": "MADISON",
  "PolicyNumber": "POL-2025-123456",
  "SumInsured": 450,
  "Premium": 450,
  "StartDate": "2025-12-30",
  "EndDate": "2026-12-30",
  "ClientID": "CLIENT-UUID-HERE",
  ...
}

Response:
{
  "Success": true,
  "certificate_number": "A1020701",
  "transaction_no": "TXN-12345",
  "urlResult": "PDF_URL_OR_BASE64"
}
```

**Certificate Types**:

- **Type A**: Third-Party (TOR, Third Party, Third Party + PLL)
- **Type B**: Comprehensive (Comprehensive, Comprehensive + PLL)

#### 4.11 VALIDATE DOUBLE INSURANCE

```
POST /api/V1/Vehicle/ValidateDoubleInsurance
Request Body:
{
  "Vehicle_Registration": "KDB016H",
  "coverageStartDate": "2025-12-30"
}

Response:
{
  "has_existing_cover": true,
  "existing_cover_expiry": "2026-01-15",
  "can_proceed": false  # If cover_start <= existing_expiry
}
```

**Usage**: Validate no overlapping cover before issuance (already integrated in Motor3 Step 2)

---

## Implementation Plan

### Phase 1: DMVIC Certificate Integration (Priority: CRITICAL)

**Status**: Backend exists, needs frontend trigger

#### 1.1 Certificate Issuance Flow

**Trigger Point**: After successful payment confirmation (Step7_Payment.js `processPayment()`)

**Flow**:

```
Payment Success
  ↓
Backend: POST /api/motor2/policies/{policy_id}/activate/
  ↓
Backend: MotorPolicy.activate_policy(transaction_id, payment_date, payment_method)
  ↓
Backend: DMVICCertificateManager.issue_certificate(policy)
  → Attempts 1-3 with retries (5s, 15s, 30s)
  → Maps policy data to DMVIC payload (Type A/B)
  → Calls DMVIC IssueTyp{A|B}Certificate
  ↓
SUCCESS Path:
  - Update MotorPolicy.dmvic_certificate_number
  - Update MotorPolicy.dmvic_certificate_pdf_url
  - Update MotorPolicy.status = 'ACTIVE'
  - Return certificate_url to frontend
  ↓
FAILURE Path (After 3 retries):
  - Policy stays PENDING_PAYMENT
  - Log error: DMVICCertificate.error_message
  - Admin alert: Certificate issuance failed
  - Frontend: Show "Certificate pending" message
```

#### 1.2 Backend Endpoints Needed

**Endpoint 1**: Policy Activation (Already exists in Django)

```python
# insurance-app/app/views.py
POST /api/motor2/policies/{policy_id}/activate/
Request Body:
{
  "transaction_id": "ABC123",
  "payment_date": "2025-12-30T10:30:00Z",
  "payment_method": "MPESA"
}

Response:
{
  "policy_number": "POL-2025-123456",
  "status": "ACTIVE",
  "certificate_url": "https://dmvic.../A1020701.pdf",
  "certificate_number": "A1020701",
  "policy_document_url": "https://s3.../policy_POL-2025-123456.pdf",
  "receipt_url": "https://s3.../receipt_POL-2025-123456.pdf"
}
```

**Endpoint 2**: Certificate Status Check

```python
GET /api/motor2/policies/{policy_id}/certificate-status/

Response:
{
  "status": "ISSUED" | "PENDING" | "FAILED",
  "certificate_number": "A1020701",
  "certificate_url": "https://dmvic.../cert.pdf",
  "retry_count": 2,
  "error_message": null,
  "issued_at": "2025-12-30T10:35:00Z"
}
```

**Endpoint 3**: Manual Certificate Retry (Admin tool)

```python
POST /api/motor2/policies/{policy_id}/retry-certificate/

Response:
{
  "success": true,
  "certificate_number": "A1020701",
  "certificate_url": "https://dmvic.../cert.pdf"
}
```

#### 1.3 Frontend Integration (Step7_Payment.js)

**Update `processPayment()` to call activation endpoint**:

```javascript
// Step7_Payment.js - After payment success
const activatePolicy = async (policyId, transactionId) => {
  try {
    setPaymentStatus("Generating certificate...");

    const response = await DjangoAPIService.activatePolicy(policyId, {
      transaction_id: transactionId,
      payment_date: new Date().toISOString(),
      payment_method: paymentMethod,
    });

    if (response.status === "ACTIVE") {
      // Certificate issued successfully
      setPaymentStatus("Policy activated! Certificate ready.");

      // Navigate to success screen with policy details
      navigation.navigate("PolicySuccess", {
        policy_number: response.policy_number,
        certificate_url: response.certificate_url,
        certificate_number: response.certificate_number,
        receipt_url: response.receipt_url,
        policy_document_url: response.policy_document_url,
      });
    } else if (response.status === "PENDING_PAYMENT") {
      // Certificate issuance failed after retries
      Alert.alert(
        "Payment Received",
        "Your payment was successful. Certificate generation is in progress. You will be notified once ready.",
        [
          {
            text: "View Policy",
            onPress: () =>
              navigation.navigate("PolicyPending", {
                policy_number: response.policy_number,
              }),
          },
        ]
      );
    }
  } catch (error) {
    logger.error("[Payment] Policy activation failed:", error);
    Alert.alert(
      "Error",
      "Payment received but policy activation failed. Contact support."
    );
  }
};

// Sandbox: Auto-activate after STK push
if (IS_SANDBOX) {
  const mockPolicyId = "POLICY-SANDBOX-" + Date.now();
  const mockTransactionId =
    initiateResponse.merchant_request_id || "SANDBOX-TXN";
  await activatePolicy(mockPolicyId, mockTransactionId);
} else {
  // Production: Poll payment status, then activate
  // (existing polling logic)
}
```

---

### Phase 2: Receipt/Invoice Generation

**Status**: Needs implementation (PDF generation)

#### 2.1 Receipt Design

**Format**: PDF generated server-side (Django + ReportLab or WeasyPrint)

**Content**:

```
┌────────────────────────────────────────┐
│  PATAB IMA INSURANCE SERVICES          │
│  Receipt No: RCP-2025-123456           │
│  Date: December 30, 2025               │
├────────────────────────────────────────┤
│  Policy Number: POL-2025-123456        │
│  Client: John Doe                      │
│  Vehicle: KDB 016H                     │
│  Cover Type: Third Party TOR           │
├────────────────────────────────────────┤
│  Base Premium:          KSh 450.00     │
│  Training Levy (0.25%): KSh 1.12       │
│  PCF Levy (0.25%):      KSh 1.12       │
│  Stamp Duty:            KSh 40.00      │
│  ─────────────────────────────────────│
│  Total Paid:            KSh 492.24     │
├────────────────────────────────────────┤
│  Payment Method: M-PESA                │
│  Transaction ID: ABC123456             │
│  Payment Date: Dec 30, 2025 10:30 AM   │
├────────────────────────────────────────┤
│  Insurer: Jubilee Insurance            │
│  Certificate No: A1020701              │
│  Cover Period: Dec 30, 2025 - Dec 30,  │
│                2026                    │
└────────────────────────────────────────┘
```

#### 2.2 Backend Implementation

**Django Service** (Create new file: `insurance-app/app/services/receipt_generator.py`):

```python
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from io import BytesIO
from django.core.files.base import ContentFile
from app.services.s3_storage import S3Service

class ReceiptGenerator:
    """
    Generate payment receipts for motor policies
    """

    @classmethod
    def generate_receipt(cls, policy: MotorPolicy) -> str:
        """
        Generate receipt PDF and upload to S3

        Returns:
            str: S3 URL of generated receipt
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)

        # Build receipt content
        elements = []
        styles = getSampleStyleSheet()

        # Header
        header_style = ParagraphStyle(
            'HeaderStyle',
            parent=styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor('#D5222B'),
            alignment=1  # Center
        )
        elements.append(Paragraph("PATAB IMA INSURANCE SERVICES", header_style))
        elements.append(Spacer(1, 0.2 * inch))

        # Receipt number and date
        receipt_no = f"RCP-{policy.policy_number.split('-')[1]}-{policy.policy_number.split('-')[2]}"
        elements.append(Paragraph(f"Receipt No: {receipt_no}", styles['Normal']))
        elements.append(Paragraph(f"Date: {timezone.now().strftime('%B %d, %Y')}", styles['Normal']))
        elements.append(Spacer(1, 0.3 * inch))

        # Policy details table
        policy_data = [
            ['Policy Number:', policy.policy_number],
            ['Client:', policy.client_details.get('full_name') or policy.client_details.get('name')],
            ['Vehicle:', policy.vehicle_details.get('registration')],
            ['Cover Type:', policy.product_details.get('subcategory_name')],
        ]

        # Premium breakdown table
        premium = policy.premium_breakdown
        premium_data = [
            ['Base Premium:', f"KSh {premium['base_premium']:,.2f}"],
            ['Training Levy (0.25%):', f"KSh {premium['training_levy']:,.2f}"],
            ['PCF Levy (0.25%):', f"KSh {premium['pcf_levy']:,.2f}"],
            ['Stamp Duty:', f"KSh {premium['stamp_duty']:,.2f}"],
            ['', ''],  # Divider
            ['Total Paid:', f"KSh {premium['total_premium']:,.2f}"],
        ]

        # Payment details
        payment = policy.payment_details
        payment_data = [
            ['Payment Method:', payment.get('method', 'N/A')],
            ['Transaction ID:', payment.get('transaction_id', 'N/A')],
            ['Payment Date:', payment.get('payment_date', timezone.now()).strftime('%b %d, %Y %I:%M %p')],
        ]

        # Insurance details
        insurance_data = [
            ['Insurer:', policy.underwriter_details.get('name')],
            ['Certificate No:', policy.dmvic_certificate_number or 'Pending'],
            ['Cover Period:', f"{policy.cover_start_date.strftime('%b %d, %Y')} - {policy.cover_end_date.strftime('%b %d, %Y')}"],
        ]

        # Create tables
        for data in [policy_data, premium_data, payment_data, insurance_data]:
            table = Table(data, colWidths=[3*inch, 3*inch])
            table.setStyle([
                ('FONT', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('ALIGN', (0, 0), (0, -1), 'LEFT'),
                ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ])
            elements.append(table)
            elements.append(Spacer(1, 0.3 * inch))

        # Build PDF
        doc.build(elements)
        buffer.seek(0)

        # Upload to S3
        s3_service = S3Service()
        file_key = f"receipts/{policy.policy_number}_receipt.pdf"
        receipt_url = s3_service.upload_file(
            file_obj=ContentFile(buffer.read()),
            file_name=file_key,
            content_type='application/pdf'
        )

        # Update policy
        policy.receipt_url = receipt_url
        policy.save(update_fields=['receipt_url'])

        return receipt_url
```

**API Endpoint**:

```python
# insurance-app/app/views.py
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_receipt(request, policy_id):
    """Generate receipt for a policy"""
    try:
        policy = MotorPolicy.objects.get(id=policy_id, user=request.user)

        # Check if receipt already exists
        if policy.receipt_url:
            return Response({'receipt_url': policy.receipt_url})

        # Generate receipt
        receipt_url = ReceiptGenerator.generate_receipt(policy)

        return Response({
            'receipt_url': receipt_url,
            'policy_number': policy.policy_number
        })
    except MotorPolicy.DoesNotExist:
        return Response({'error': 'Policy not found'}, status=404)
```

---

### Phase 3: Policy Document Generation

**Status**: Needs implementation (Comprehensive policy PDF)

#### 3.1 Policy Document Design

**Format**: Multi-page PDF with complete policy details

**Content Structure**:

```
Page 1: Cover Page
  - PATAB IMA Logo
  - Policy Number (Large, prominent)
  - Client Name
  - Vehicle Registration
  - Cover Dates
  - Insurer Logo

Page 2: Policy Schedule
  - Insured: Client details (Name, ID, Phone, Email)
  - Vehicle: Make, Model, Year, Registration, Chassis, Engine
  - Cover Type: Third Party TOR / Comprehensive
  - Sum Insured: (if applicable)
  - Premium Breakdown: Base, Levies, Total
  - Addons: (if any)

Page 3: Terms & Conditions
  - General Policy Conditions
  - Exclusions
  - Claims Procedure
  - Contact Information

Page 4: Certificate Attachment
  - DMVIC Certificate (if available)
```

#### 3.2 Backend Implementation

**Django Service** (Create: `insurance-app/app/services/policy_document_generator.py`):

```python
class PolicyDocumentGenerator:
    """
    Generate comprehensive policy documents
    """

    @classmethod
    def generate_policy_document(cls, policy: MotorPolicy) -> str:
        """
        Generate policy PDF with all details

        Returns:
            str: S3 URL of generated policy document
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)

        elements = []
        styles = getSampleStyleSheet()

        # Page 1: Cover Page
        cls._build_cover_page(elements, styles, policy)
        elements.append(PageBreak())

        # Page 2: Policy Schedule
        cls._build_policy_schedule(elements, styles, policy)
        elements.append(PageBreak())

        # Page 3: Terms & Conditions
        cls._build_terms_conditions(elements, styles, policy)

        # Build PDF
        doc.build(elements)
        buffer.seek(0)

        # Upload to S3
        s3_service = S3Service()
        file_key = f"policies/{policy.policy_number}_policy.pdf"
        policy_url = s3_service.upload_file(
            file_obj=ContentFile(buffer.read()),
            file_name=file_key,
            content_type='application/pdf'
        )

        # Update policy
        policy.policy_document_url = policy_url
        policy.save(update_fields=['policy_document_url'])

        return policy_url

    @classmethod
    def _build_cover_page(cls, elements, styles, policy):
        """Build cover page"""
        # Logo
        # elements.append(Image('path/to/logo.png', width=2*inch, height=1*inch))

        # Policy number
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#D5222B'),
            alignment=1
        )
        elements.append(Spacer(1, 2*inch))
        elements.append(Paragraph(f"Policy No: {policy.policy_number}", title_style))
        elements.append(Spacer(1, 0.5*inch))

        # Client and vehicle
        info_style = ParagraphStyle(
            'InfoStyle',
            parent=styles['Normal'],
            fontSize=14,
            alignment=1
        )
        elements.append(Paragraph(f"Insured: {policy.client_details.get('full_name')}", info_style))
        elements.append(Paragraph(f"Vehicle: {policy.vehicle_details.get('registration')}", info_style))
        elements.append(Spacer(1, 0.3*inch))

        # Cover period
        elements.append(Paragraph(
            f"Cover Period: {policy.cover_start_date.strftime('%d %B %Y')} to {policy.cover_end_date.strftime('%d %B %Y')}",
            info_style
        ))
        elements.append(Spacer(1, inch))

        # Insurer
        elements.append(Paragraph(f"Insurer: {policy.underwriter_details.get('name')}", info_style))
```

---

### Phase 4: Success Screen with Downloads

**Status**: Needs creation

#### 4.1 Success Screen Design

**New Screen**: `PolicySuccessScreen.js`

**Location**: `frontend/screens/quotations/Motor3/shared/Success/PolicySuccessScreen.js`

**Features**:

1. Success animation/icon
2. Policy summary card
3. Download buttons (Certificate, Receipt, Policy Document)
4. Share options
5. Navigation buttons (Go to Home, View Policies)

#### 4.2 Frontend Implementation

```javascript
// frontend/screens/quotations/Motor3/shared/Success/PolicySuccessScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

const PolicySuccessScreen = ({ route, navigation }) => {
  const {
    policy_number,
    certificate_url,
    certificate_number,
    receipt_url,
    policy_document_url,
    client_name,
    vehicle_registration,
    cover_type,
    total_premium,
  } = route.params;

  const [downloading, setDownloading] = useState(null);

  const handleDownload = async (url, filename, docType) => {
    if (!url) {
      Alert.alert(
        "Not Available",
        `${docType} is being generated. Check back shortly.`
      );
      return;
    }

    setDownloading(docType);

    try {
      // Download file
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      const downloadResult = await FileSystem.downloadAsync(url, fileUri);

      if (downloadResult.status === 200) {
        // Share file
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: "application/pdf",
            dialogTitle: `Share ${docType}`,
          });
        } else {
          Alert.alert("Success", `${docType} downloaded successfully!`);
        }
      } else {
        throw new Error("Download failed");
      }
    } catch (error) {
      console.error(`[PolicySuccess] ${docType} download failed:`, error);
      Alert.alert("Error", `Failed to download ${docType}. Please try again.`);
    } finally {
      setDownloading(null);
    }
  };

  const handleOpenUrl = async (url) => {
    if (!url) {
      Alert.alert("Not Available", "Document is being generated.");
      return;
    }

    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Error", "Cannot open document URL");
    }
  };

  return (
    <View style={styles.container}>
      {/* Success Icon */}
      <View style={styles.successIcon}>
        <Ionicons name="checkmark-circle" size={100} color="#22c55e" />
      </View>

      {/* Success Message */}
      <Text style={styles.title}>Policy Activated Successfully!</Text>
      <Text style={styles.subtitle}>Your insurance cover is now active</Text>

      {/* Policy Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Policy Summary</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.label}>Policy Number:</Text>
          <Text style={styles.value}>{policy_number}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.label}>Client:</Text>
          <Text style={styles.value}>{client_name}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.label}>Vehicle:</Text>
          <Text style={styles.value}>{vehicle_registration}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.label}>Cover Type:</Text>
          <Text style={styles.value}>{cover_type}</Text>
        </View>

        {certificate_number && (
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Certificate No:</Text>
            <Text style={styles.value}>{certificate_number}</Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total Premium:</Text>
          <Text style={styles.totalValue}>
            KSh {total_premium?.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Download Buttons */}
      <View style={styles.downloadSection}>
        <Text style={styles.sectionTitle}>Download Documents</Text>

        {/* Certificate */}
        <TouchableOpacity
          style={[
            styles.downloadButton,
            !certificate_url && styles.disabledButton,
          ]}
          onPress={() =>
            handleDownload(
              certificate_url,
              `certificate_${policy_number}.pdf`,
              "Certificate"
            )
          }
          disabled={downloading === "Certificate"}
        >
          <Ionicons
            name="shield-checkmark"
            size={24}
            color={certificate_url ? "#D5222B" : "#9ca3af"}
          />
          <Text
            style={[
              styles.downloadText,
              !certificate_url && styles.disabledText,
            ]}
          >
            {downloading === "Certificate"
              ? "Downloading..."
              : "Insurance Certificate"}
          </Text>
          <Ionicons
            name="download"
            size={20}
            color={certificate_url ? "#D5222B" : "#9ca3af"}
          />
        </TouchableOpacity>

        {/* Receipt */}
        <TouchableOpacity
          style={[styles.downloadButton, !receipt_url && styles.disabledButton]}
          onPress={() =>
            handleDownload(
              receipt_url,
              `receipt_${policy_number}.pdf`,
              "Receipt"
            )
          }
          disabled={downloading === "Receipt"}
        >
          <Ionicons
            name="receipt"
            size={24}
            color={receipt_url ? "#D5222B" : "#9ca3af"}
          />
          <Text
            style={[styles.downloadText, !receipt_url && styles.disabledText]}
          >
            {downloading === "Receipt" ? "Downloading..." : "Payment Receipt"}
          </Text>
          <Ionicons
            name="download"
            size={20}
            color={receipt_url ? "#D5222B" : "#9ca3af"}
          />
        </TouchableOpacity>

        {/* Policy Document */}
        <TouchableOpacity
          style={[
            styles.downloadButton,
            !policy_document_url && styles.disabledButton,
          ]}
          onPress={() =>
            handleDownload(
              policy_document_url,
              `policy_${policy_number}.pdf`,
              "Policy Document"
            )
          }
          disabled={downloading === "Policy Document"}
        >
          <Ionicons
            name="document-text"
            size={24}
            color={policy_document_url ? "#D5222B" : "#9ca3af"}
          />
          <Text
            style={[
              styles.downloadText,
              !policy_document_url && styles.disabledText,
            ]}
          >
            {downloading === "Policy Document"
              ? "Downloading..."
              : "Policy Document"}
          </Text>
          <Ionicons
            name="download"
            size={20}
            color={policy_document_url ? "#D5222B" : "#9ca3af"}
          />
        </TouchableOpacity>
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigationSection}>
        <TouchableOpacity
          style={[styles.navButton, styles.secondaryButton]}
          onPress={() => navigation.navigate("Policies")}
        >
          <Text style={styles.secondaryButtonText}>View My Policies</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, styles.primaryButton]}
          onPress={() => navigation.navigate("Dashboard")}
        >
          <Text style={styles.primaryButtonText}>Go to Home</Text>
        </TouchableOpacity>
      </View>

      {/* Support Note */}
      <Text style={styles.supportText}>
        Need help? Contact support at support@patabima.com
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    padding: 20,
  },
  successIcon: {
    alignItems: "center",
    marginVertical: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 30,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: "#6b7280",
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#D5222B",
  },
  downloadSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 12,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  disabledButton: {
    opacity: 0.5,
  },
  downloadText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginLeft: 12,
  },
  disabledText: {
    color: "#9ca3af",
  },
  navigationSection: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  navButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#D5222B",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D5222B",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButtonText: {
    color: "#D5222B",
    fontSize: 16,
    fontWeight: "700",
  },
  supportText: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
  },
});

export default PolicySuccessScreen;
```

---

### Phase 5: SMS/Email Notifications

**Status**: Needs implementation

#### 5.1 Notification Triggers

**Trigger Points**:

1. **Payment Received**: Immediate SMS to client confirming payment
2. **Policy Activated**: SMS + Email with policy number, certificate number, download links
3. **Certificate Ready**: SMS if certificate generation was delayed
4. **Daily Reminder**: Email to agents for policies pending certificate

#### 5.2 Backend Implementation

**Django Service** (Create: `insurance-app/app/services/notification_service.py`):

```python
from twilio.rest import Client
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings

class NotificationService:
    """
    Send SMS and Email notifications
    """

    @classmethod
    def send_payment_confirmation_sms(cls, policy: MotorPolicy):
        """Send SMS confirming payment received"""
        client_phone = policy.client_details.get('phone')
        if not client_phone:
            return

        message = (
            f"PataBima: Payment of KSh {policy.premium_breakdown['total_premium']:,.0f} "
            f"received for policy {policy.policy_number}. Processing your certificate now."
        )

        cls._send_sms(client_phone, message)

    @classmethod
    def send_policy_activation_notification(cls, policy: MotorPolicy):
        """Send SMS + Email when policy is activated"""
        client_phone = policy.client_details.get('phone')
        client_email = policy.client_details.get('email')
        client_name = policy.client_details.get('full_name') or policy.client_details.get('name')

        # SMS
        if client_phone:
            sms_message = (
                f"PataBima: Your policy {policy.policy_number} is now ACTIVE! "
                f"Certificate No: {policy.dmvic_certificate_number}. "
                f"Download: https://patabima.com/p/{policy.policy_number}"
            )
            cls._send_sms(client_phone, sms_message)

        # Email
        if client_email:
            subject = f"Your Insurance Policy is Active - {policy.policy_number}"

            context = {
                'client_name': client_name,
                'policy_number': policy.policy_number,
                'certificate_number': policy.dmvic_certificate_number,
                'vehicle_registration': policy.vehicle_details.get('registration'),
                'cover_type': policy.product_details.get('subcategory_name'),
                'cover_start': policy.cover_start_date.strftime('%d %B %Y'),
                'cover_end': policy.cover_end_date.strftime('%d %B %Y'),
                'certificate_url': policy.certificate_url,
                'receipt_url': policy.receipt_url,
                'policy_document_url': policy.policy_document_url,
                'total_premium': policy.premium_breakdown['total_premium'],
            }

            html_message = render_to_string('emails/policy_activation.html', context)

            send_mail(
                subject=subject,
                message='',  # Plain text fallback
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[client_email],
                html_message=html_message,
                fail_silently=False,
            )

    @classmethod
    def _send_sms(cls, phone_number: str, message: str):
        """Send SMS using Twilio"""
        try:
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

            message = client.messages.create(
                body=message,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=phone_number
            )

            logger.info(f"SMS sent to {phone_number}: {message.sid}")
        except Exception as e:
            logger.error(f"SMS sending failed to {phone_number}: {str(e)}")
```

**Email Template** (Create: `insurance-app/templates/emails/policy_activation.html`):

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Policy Activation</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        background: #d5222b;
        color: white;
        padding: 20px;
        text-align: center;
      }
      .content {
        padding: 20px;
        background: #f9f9f9;
      }
      .button {
        display: inline-block;
        padding: 12px 24px;
        background: #d5222b;
        color: white;
        text-decoration: none;
        border-radius: 8px;
        margin: 10px 5px;
      }
      .footer {
        text-align: center;
        padding: 20px;
        font-size: 12px;
        color: #666;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🎉 Your Insurance Policy is Active!</h1>
      </div>

      <div class="content">
        <p>Dear {{ client_name }},</p>

        <p>
          Congratulations! Your motor insurance policy is now
          <strong>ACTIVE</strong> and ready to protect your vehicle.
        </p>

        <h3>Policy Details:</h3>
        <ul>
          <li><strong>Policy Number:</strong> {{ policy_number }}</li>
          <li><strong>Certificate Number:</strong> {{ certificate_number }}</li>
          <li><strong>Vehicle:</strong> {{ vehicle_registration }}</li>
          <li><strong>Cover Type:</strong> {{ cover_type }}</li>
          <li>
            <strong>Cover Period:</strong> {{ cover_start }} to {{ cover_end }}
          </li>
          <li>
            <strong>Premium Paid:</strong> KSh {{ total_premium|floatformat:2 }}
          </li>
        </ul>

        <h3>Download Your Documents:</h3>
        <div style="text-align: center;">
          <a href="{{ certificate_url }}" class="button"
            >📄 Insurance Certificate</a
          >
          <a href="{{ receipt_url }}" class="button">🧾 Payment Receipt</a>
          <a href="{{ policy_document_url }}" class="button"
            >📋 Policy Document</a
          >
        </div>

        <p style="margin-top: 20px;">
          <strong>Important:</strong> Keep your certificate with you at all
          times when driving. You may be required to show it during police
          checks or in case of an accident.
        </p>

        <p>If you have any questions, please contact us at:</p>
        <ul>
          <li>📧 Email: support@patabima.com</li>
          <li>📞 Phone: +254 700 000 000</li>
        </ul>
      </div>

      <div class="footer">
        <p>© 2025 PataBima Insurance Services. All rights reserved.</p>
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  </body>
</html>
```

---

## Implementation Checklist

### Backend Tasks

- [ ] **Certificate Generation**

  - [ ] Verify `DMVICCertificateManager` handles Type A/B correctly
  - [ ] Test certificate issuance with retry logic (simulate DMVIC failures)
  - [ ] Add `/api/motor2/policies/{id}/activate/` endpoint
  - [ ] Add `/api/motor2/policies/{id}/certificate-status/` endpoint
  - [ ] Add `/api/motor2/policies/{id}/retry-certificate/` endpoint (admin)

- [ ] **Receipt Generation**

  - [ ] Create `ReceiptGenerator` service
  - [ ] Install `reportlab` dependency: `pip install reportlab`
  - [ ] Add `/api/motor2/policies/{id}/generate-receipt/` endpoint
  - [ ] Test receipt PDF generation with sample policy
  - [ ] Upload receipt to S3 and return URL

- [ ] **Policy Document Generation**

  - [ ] Create `PolicyDocumentGenerator` service
  - [ ] Design comprehensive policy document template
  - [ ] Add `/api/motor2/policies/{id}/generate-policy-document/` endpoint
  - [ ] Test multi-page PDF generation
  - [ ] Upload policy document to S3 and return URL

- [ ] **Notifications**

  - [ ] Create `NotificationService` with SMS/Email methods
  - [ ] Create email template: `policy_activation.html`
  - [ ] Configure Twilio credentials in `.env`
  - [ ] Configure Django email backend (AWS SES or SMTP)
  - [ ] Test SMS sending to Kenyan numbers
  - [ ] Test email delivery with attachments

- [ ] **Database Migrations**
  - [ ] Verify `MotorPolicy` has all DMVIC fields
  - [ ] Verify `DMVICCertificate` model exists
  - [ ] Run migrations: `python manage.py migrate`

### Frontend Tasks

- [ ] **Payment Flow Integration**

  - [ ] Update `Step7_Payment.js` to call `/activate/` endpoint after payment
  - [ ] Handle certificate generation loading state
  - [ ] Handle certificate generation failures gracefully
  - [ ] Show "Certificate pending" message if DMVIC fails

- [ ] **Success Screen**

  - [ ] Create `PolicySuccessScreen.js`
  - [ ] Implement download buttons for Certificate, Receipt, Policy Document
  - [ ] Add file download logic using `expo-file-system`
  - [ ] Add share functionality using `expo-sharing`
  - [ ] Add navigation buttons (Go to Home, View Policies)

- [ ] **Navigation Setup**

  - [ ] Add `PolicySuccessScreen` to Motor3 navigation stack
  - [ ] Update `Step7_Payment` to navigate to success screen after activation
  - [ ] Update `Step8_Payment` (Comprehensive) similarly

- [ ] **Error Handling**
  - [ ] Handle certificate generation timeout (>60s)
  - [ ] Handle document download failures
  - [ ] Handle missing document URLs gracefully

### Testing Tasks

- [ ] **Backend Tests**

  - [ ] Unit test: `ReceiptGenerator.generate_receipt()`
  - [ ] Unit test: `PolicyDocumentGenerator.generate_policy_document()`
  - [ ] Unit test: `NotificationService.send_policy_activation_notification()`
  - [ ] Integration test: Full payment → activation → documents → notifications flow
  - [ ] Integration test: DMVIC certificate issuance with retries

- [ ] **Frontend Tests**

  - [ ] Component test: `PolicySuccessScreen` renders correctly
  - [ ] Component test: Download buttons trigger downloads
  - [ ] Integration test: Payment → Success Screen navigation
  - [ ] E2E test: Complete Motor3 flow from quotation to success screen

- [ ] **Manual Testing**
  - [ ] Test with real DMVIC API (UAT environment)
  - [ ] Test with live payment (M-PESA sandbox)
  - [ ] Test SMS delivery to actual phone
  - [ ] Test email delivery with all attachments
  - [ ] Test on Android device/emulator
  - [ ] Test download and share functionality

---

## Deployment Checklist

### Environment Configuration

- [ ] **Django Settings**

  ```python
  # DMVIC Configuration
  DMVIC_BASE_URL = os.getenv('DMVIC_BASE_URL', 'https://uat-api.dmvic.com')
  DMVIC_USERNAME = os.getenv('DMVIC_USERNAME')
  DMVIC_PASSWORD = os.getenv('DMVIC_PASSWORD')
  DMVIC_CLIENT_ID = os.getenv('DMVIC_CLIENT_ID')
  DMVIC_PFX_PATH = os.getenv('DMVIC_PFX_PATH', 'certs/dmvic.pfx')
  DMVIC_PASSPHRASE = os.getenv('DMVIC_PASSPHRASE')

  # Notification Configuration
  TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
  TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
  TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER')

  # Email Configuration (AWS SES)
  EMAIL_BACKEND = 'django_ses.SESBackend'
  AWS_SES_REGION_NAME = 'us-east-1'
  AWS_SES_REGION_ENDPOINT = 'email.us-east-1.amazonaws.com'
  DEFAULT_FROM_EMAIL = 'PataBima Insurance <noreply@patabima.com>'
  ```

- [ ] **EC2 Deployment**

  - [ ] Install `reportlab`: `pip install reportlab`
  - [ ] Upload DMVIC certificate: `scp dmvic.pfx ec2:~/insurance-app/certs/`
  - [ ] Set environment variables in EC2
  - [ ] Restart Gunicorn: `sudo systemctl restart gunicorn`
  - [ ] Test certificate generation on EC2

- [ ] **Frontend Environment**
  - [ ] No additional config needed (uses existing `EXPO_PUBLIC_API_BASE_URL`)

### Production Rollout

- [ ] **Phase 1: Backend Only** (Week 1)

  - [ ] Deploy certificate generation endpoints
  - [ ] Test DMVIC integration manually
  - [ ] Monitor error logs for certificate failures

- [ ] **Phase 2: Receipt + Policy Document** (Week 2)

  - [ ] Deploy PDF generation services
  - [ ] Test document generation with sample policies
  - [ ] Verify S3 uploads working

- [ ] **Phase 3: Frontend Success Screen** (Week 3)

  - [ ] Deploy success screen
  - [ ] Test complete payment → success flow
  - [ ] Test document downloads on Android

- [ ] **Phase 4: Notifications** (Week 4)
  - [ ] Deploy notification service
  - [ ] Test SMS delivery
  - [ ] Test email delivery
  - [ ] Monitor notification logs

---

## Risk Mitigation

### Risk 1: DMVIC API Downtime

**Impact**: High - Policy cannot be activated  
**Mitigation**:

- ✅ Retry logic with 3 attempts (5s, 15s, 30s delays)
- ✅ Policy stays `PENDING_PAYMENT` if DMVIC fails
- Admin dashboard alert for failed certificates
- Manual retry endpoint for admins
- Daily cron job to retry failed certificates

### Risk 2: Certificate Generation Timeout

**Impact**: Medium - User waits too long  
**Mitigation**:

- Show "Generating certificate..." loader with timeout (60s)
- If timeout, show "Certificate pending" message
- Send SMS when certificate is ready
- Allow user to check certificate status later

### Risk 3: PDF Generation Fails

**Impact**: Low - User can still get certificate from DMVIC  
**Mitigation**:

- Generate receipts/policy documents asynchronously
- Display "Document generation in progress" if not ready
- Retry document generation on next policy view

### Risk 4: SMS/Email Delivery Fails

**Impact**: Low - User still has access via app  
**Mitigation**:

- Log notification failures
- Retry failed notifications (background task)
- Provide manual "Resend notification" button in admin

---

## Future Enhancements

1. **WhatsApp Notifications** (using Twilio WhatsApp Business API)
2. **Push Notifications** (using Expo Notifications)
3. **QR Code on Receipt** (for quick policy lookup)
4. **Policy Renewal Reminders** (30 days before expiry)
5. **Digital Wallet Integration** (add certificate to Apple/Google Wallet)
6. **Multi-language Support** (Swahili translations)

---

## Support & Troubleshooting

### Common Issues

**Issue**: Certificate generation fails with "Invalid client certificate"  
**Solution**: Verify `.pfx` file is uploaded to EC2 and passphrase is correct in `.env`

**Issue**: Receipt PDF is blank  
**Solution**: Check `reportlab` installation and font paths

**Issue**: SMS not delivered  
**Solution**: Verify Twilio account has sufficient credits and phone number is verified

**Issue**: Email goes to spam  
**Solution**: Configure SPF/DKIM records for AWS SES domain

---

## Conclusion

This plan provides a comprehensive roadmap for completing the Motor3 post-payment flow. The implementation is structured in phases to allow incremental testing and deployment. Each component has clear dependencies and can be tested independently before integration.

**Estimated Timeline**: 4 weeks (assuming 1 developer)

- Week 1: Backend (Certificate + Endpoints)
- Week 2: Backend (Receipt + Policy Document)
- Week 3: Frontend (Success Screen)
- Week 4: Notifications + Testing + Deployment

**Next Steps**:

1. Review this plan with the team
2. Assign tasks to developers
3. Set up DMVIC UAT access for testing
4. Begin Phase 1 implementation

---

**Questions for Review**:

1. Do we have DMVIC UAT credentials and `.pfx` certificate?
2. Should we prioritize SMS or Email notifications first?
3. Do we need physical receipt printing support?
4. Should we integrate with any specific payment gateways besides M-PESA?
5. Do we need multi-tenant support (different agents seeing only their policies)?

---

_Document Version: 1.0_  
_Last Updated: December 30, 2025_
