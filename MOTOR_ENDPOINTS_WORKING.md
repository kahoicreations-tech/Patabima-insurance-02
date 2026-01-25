# Motor Insurance - Working Endpoints

**PataBima Backend API**  
_Updated: January 18, 2026_

---

## 🔧 Base URLs

- **Development (Local)**: `http://localhost:8000`
- **Development (Android Emulator)**: `http://10.0.2.2:8000`
- **Production (EC2)**: Set via `EXPO_PUBLIC_API_BASE_URL` environment variable

---

## 📋 Table of Contents

1. [Motor2 Flow Endpoints](#motor2-flow-endpoints)
2. [Motor3 Quotations Endpoints](#motor3-quotations-endpoints)
3. [Policy Management Endpoints](#policy-management-endpoints)
4. [DMVIC Integration Endpoints](#dmvic-integration-endpoints)
5. [Payment Gateway Endpoints](#payment-gateway-endpoints)
6. [Document Upload Endpoints](#document-upload-endpoints)
7. [Authentication Endpoints](#authentication-endpoints)
8. [OTP Endpoints](#otp-endpoints)
9. [Claims Endpoints](#claims-endpoints)
10. [Admin Endpoints](#admin-endpoints)

---

## 🚗 Motor2 Flow Endpoints

### Metadata

```
GET /api/v1/motor2/metadata/version/
```

**Purpose**: Get static data version for cache management  
**Auth**: Not Required  
**Response**: Version info and checksums

### Categories

```
GET /api/v1/motor2/categories/
GET /api/v1/motor/categories/ (LEGACY)
```

**Purpose**: Get all motor insurance categories  
**Auth**: Not Required  
**Response**: List of categories (Private, Commercial, PSV, Motorcycle, Tuk-Tuk, Special)

### Subcategories

```
GET /api/v1/motor2/subcategories/
GET /api/v1/motor/subcategories/ (LEGACY)
Query params: ?category=PRIVATE
```

**Purpose**: Get subcategories for a specific category  
**Auth**: Not Required  
**Response**: List of products (Third-Party, TOR, Comprehensive, Extendible)

### Field Requirements

```
GET /api/v1/motor2/field-requirements/
GET /api/v1/motor/field-requirements/ (LEGACY)
Query params: ?category=PRIVATE&subcategory=PRIVATE_TOR
```

**Purpose**: Get required fields and validation rules for a product  
**Auth**: Not Required  
**Response**: Field requirements, validation rules

### Underwriters

```
GET /api/v1/public_app/insurance/get_underwriters
GET /api/v1/public_app/insurance/get_underwriters/
Query params: ?subcategory=PRIVATE_TOR
```

**Purpose**: Get available underwriters for a product  
**Auth**: Not Required  
**Response**: List of underwriters with commission rates

### Premium Calculation

```
POST /api/v1/public_app/insurance/calculate_motor_premium
POST /api/v1/public_app/insurance/calculate_motor_premium/
```

**Purpose**: Calculate premium for a motor policy  
**Auth**: Not Required  
**Request Body**:

```json
{
  "subcategory": "PRIVATE_TOR",
  "underwriter_id": 1,
  "vehicle_value": 2000000,
  "tonnage": null,
  "capacity": 5,
  "cover_start_date": "2026-01-20",
  "is_extendible": false
}
```

**Response**: Premium breakdown (base, levies, total)

### Pricing Comparison

```
POST /api/v1/public_app/insurance/compare_motor_pricing
POST /api/v1/public_app/insurance/compare_motor_pricing/
```

**Purpose**: Compare premiums across underwriters  
**Auth**: Not Required  
**Request Body**: Same as calculate_motor_premium  
**Response**: Premium comparison for all underwriters

### Add-ons

```
GET /api/v1/public_app/insurance/addons
GET /api/v1/public_app/insurance/addons/
Query params: ?underwriter_id=1
```

**Purpose**: Get available add-ons (windscreen, radio, etc.)  
**Auth**: Not Required  
**Response**: List of add-ons with pricing

---

## 🆕 Motor3 Quotations Endpoints

### Create Third-Party Quotation

```
POST /api/motor3/quotations/third-party/
```

**Purpose**: Create Motor3 third-party quotation  
**Auth**: Required  
**Request Body**:

```json
{
  "subcategory_code": "PRIVATE_TOR",
  "vehicle_details": {
    "registration_number": "KCA123A",
    "make": "Toyota",
    "model": "Fielder",
    "year": 2015,
    "chassis_number": "JTFSH3P26J3012345"
  },
  "client_details": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+254712345678"
  },
  "cover_start_date": "2026-01-20",
  "underwriter_id": 1
}
```

**Response**: Quotation object with quote number

### Create Comprehensive Quotation

```
POST /api/motor3/quotations/comprehensive/
```

**Purpose**: Create Motor3 comprehensive quotation  
**Auth**: Required  
**Request Body**: Similar to third-party with additional pricing fields

### List Quotations

```
GET /api/motor3/quotations/
Query params: ?status=pending&agent_id=123
```

**Purpose**: List all quotations for authenticated agent  
**Auth**: Required  
**Response**: Paginated list of quotations

### Get Quotation

```
GET /api/motor3/quotations/{quotation_id}/
```

**Purpose**: Get detailed quotation  
**Auth**: Required  
**Response**: Full quotation object

### Get Quotation PDF

```
GET /api/motor3/quotations/{quotation_id}/pdf/
```

**Purpose**: Download quotation as PDF  
**Auth**: Required  
**Response**: PDF file

### Convert to Policy

```
POST /api/motor3/quotations/{quotation_id}/convert/
```

**Purpose**: Convert quotation to policy after payment  
**Auth**: Required  
**Request Body**:

```json
{
  "payment_reference": "MPE123456",
  "payment_method": "MPESA"
}
```

**Response**: Policy object

---

## 📄 Policy Management Endpoints

### Create Motor Policy

```
POST /api/v1/policies/motor/create/
```

**Purpose**: Create a new motor policy (Motor2)  
**Auth**: Required  
**Timeout**: Standard (30s)  
**Request Body**:

```json
{
  "subcategory_code": "PRIVATE_TOR",
  "vehicle": {
    "registration_number": "KCA123A",
    "make": "Toyota",
    "model": "Fielder",
    "year": 2015
  },
  "client": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+254712345678"
  },
  "underwriter_id": 1,
  "premium_amount": 5500.0,
  "cover_start_date": "2026-01-20",
  "payment_reference": "MPE123456"
}
```

**Response**: Policy object with policy number

### List Motor Policies

```
GET /api/v1/policies/motor/
Query params: ?status=active&agent_id=123
```

**Purpose**: List all policies for authenticated agent  
**Auth**: Required  
**Response**: Paginated list of policies

### Get Motor Policy

```
GET /api/v1/policies/motor/{policy_number}/
```

**Purpose**: Get detailed policy information  
**Auth**: Required  
**Response**: Full policy object with certificate info

### Activate Motor Policy

```
POST /api/v1/policies/motor/{policy_number}/activate/
```

**Purpose**: Activate policy after payment confirmation  
**Auth**: Required  
**Response**: Updated policy status

### Retry Policy Payment

```
POST /api/v1/policies/motor/{policy_number}/retry-payment/
```

**Purpose**: Retry failed payment  
**Auth**: Required  
**Request Body**:

```json
{
  "payment_method": "MPESA",
  "phone_number": "+254712345678"
}
```

**Response**: Payment initiation response

---

## 🔄 Policy Renewal & Extension Endpoints

### Get Upcoming Renewals

```
GET /api/v1/policies/motor/upcoming-renewals/
Query params: ?days=30
```

**Purpose**: Get policies expiring soon  
**Auth**: Required  
**Response**: List of policies eligible for renewal

### Check Renewal Eligibility

```
GET /api/v1/policies/motor/{policy_number}/renewal-eligibility/
```

**Purpose**: Check if policy can be renewed  
**Auth**: Required  
**Response**: Eligibility status and renewal premium

### Renew Motor Policy

```
POST /api/v1/policies/motor/{policy_number}/renew/
```

**Purpose**: Renew expired or expiring policy  
**Auth**: Required  
**Request Body**:

```json
{
  "new_cover_start_date": "2027-01-20",
  "payment_method": "MPESA",
  "phone_number": "+254712345678"
}
```

**Response**: New policy object

### Get Upcoming Extensions

```
GET /api/v1/policies/motor/upcoming-extensions/
Query params: ?days=7
```

**Purpose**: Get extendible policies nearing initial period end  
**Auth**: Required  
**Response**: List of policies eligible for extension

### Check Extension Eligibility

```
GET /api/v1/policies/motor/{policy_number}/extension-eligibility/
```

**Purpose**: Check if extendible policy can be extended  
**Auth**: Required  
**Response**: Eligibility status and extension balance

### Extend Motor Policy

```
POST /api/v1/policies/motor/{policy_number}/extend/
```

**Purpose**: Pay balance to extend extendible policy  
**Auth**: Required  
**Request Body**:

```json
{
  "payment_method": "MPESA",
  "phone_number": "+254712345678",
  "balance_amount": 3000.0
}
```

**Response**: Updated policy with full 12-month coverage

---

## 📜 DMVIC Integration Endpoints

**IMPORTANT: PataBima operates as an INTERMEDIARY (Broker)**

We use a **HYBRID** integration approach:

- **Vehicle Search & Validation**: Member Company endpoints (v5)
- **Certificate Operations**: Intermediary Integration endpoints (v6)

This reflects our business model: We compare insurance prices from multiple underwriters (intermediary role) before issuing certificates.

---

### Vehicle Search (Member Company v5)

```
POST /api/insurance/dmvic/search-vehicle/
```

**Purpose**: Search NTSA/DMVIC database for vehicle  
**Auth**: Not Required (Rate-limited for anonymous)  
**Timeout**: 60 seconds (Updated Jan 18, 2026)  
**Integration**: Member Company (v5) - `/api/v5/Integration/VehicleSearch`  
**Request Body**:

```json
{
  "registration_number": "KCA123A",
  "proposed_cover_start_date": "2026-01-20"
}
```

**Response**:

```json
{
  "success": true,
  "vehicle": {
    "registration_number": "KCA123A",
    "make": "Toyota",
    "model": "Fielder",
    "year_of_manufacture": 2015,
    "chassis_number": "JTFSH3P26J3012345",
    "has_active_cover": true,
    "current_policy": {
      "policy_number": "POL12345",
      "cover_end_date": "2026-01-25"
    },
    "policy_history": [...]
  },
  "has_existing_cover": true,
  "existing_cover_expiry": "2026-01-25",
  "cached": false
}
```

### Validate Double Insurance (Member Company v5)

```
POST /api/insurance/dmvic/validate-double-insurance/
```

**Purpose**: Check for active insurance (regulatory compliance)  
**Auth**: Required  
**Timeout**: 60 seconds (Updated Jan 18, 2026)  
**Integration**: Member Company (v5) - `/api/V5/Integration/ValidateDoubleInsurance`  
**Request Body**:

```json
{
  "registration_number": "KCA123A",
  "cover_start_date": "2026-01-20",
  "cover_end_date": "2027-01-20"
}
```

**Response**:

```json
{
  "has_active_cover": false,
  "dmvic_policy": null,
  "message": "No active cover found"
}
```

**Note**: BLOCKS policy submission if has_active_cover is true
(Intermediary v6)

```
POST /api/insurance/dmvic/preview-certificate/
```

**Purpose**: Preview certificate before issuance  
**Auth**: Required  
**Timeout**: 60 seconds  
**Integration**: **Intermediary (v6)** - `/api/v6/IntermediaryIntegration/PreviewTypeACertificate`  
**Note**: Works WITHOUT inventory allocation. PataBima uses Intermediary endpoints for all certificate operations as we are a broker comparing multiple insurers.
**Timeout**: 60 seconds  
**Request Body**: Cer (Intermediary v6)

```
POST /api/insurance/dmvic/issue-certificate/
```

**Purpose**: Issue DMVIC certificate for policy  
**Auth**: Required  
**Timeout**: 60 seconds (Updated Jan 18, 2026)  
**Integration**: **Intermediary (v6)** - `/api/v6/IntermediaryIntegration/IssuanceTypeACertificate`  
**Note**: PataBima uses Intermediary integration as we are a broker. Handles all certificate types (A/B/C/D).
**Purpose**: Issue DMVIC certificate for policy  
**Auth**: Required  
**Timeout**: 60 seconds (Updated Jan 18, 2026)  
**Request Body**:

```json
{
  "policy_id": 123
}
```

**Response**:

```json
{
  "success": true,
  "certificate_number": "CERT123 (Intermediary v6)
```

POST /api/insurance/dmvic/confirm-issuance/

```
**Purpose**: Confirm certificate after logbook verification
**Auth**: Required
**Timeout**: 60 seconds
**Integration**: **Intermediary (v6)** - `/api/v6/IntermediaryIntegration/ValidateTypeACertificate`
POST /api/insurance/dmvic/confirm-issuance/
```

**Purpose**: Confirm certificate after logbook verification  
**Auth**: Required  
**Timeout**: 60 seconds  
**Request Body**:

```json
{
  "issuance_request_id": "REQ123",
  "logbook_verified": t (Intermediary v6)
```

POST /api/insurance/dmvic/get-certificate-pdf/

```
**Purpose**: Download certificate PDF
**Auth**: Required
**Timeout**: 60 seconds (Updated Jan 18, 2026)
**Integration**: **Intermediary (v6)**
POST /api/insurance/dmvic/get-certificate-pdf/
```

**Purpose**: Download certificate PDF  
**Auth**: Required  
**Timeout**: 60 seconds (Updated Jan 18, 2026)  
**Request Body**:

```json
{
  "policy_id": 123,
  "certificate_number": "CERT123456"
}
```

**Response**: PDF download URL or base64 data

### DMVIC Health Check

```
GET /api/insurance/dmvic/health-check/
```

**Purpose**: Check DMVIC service availability  
**Auth**: Not Required  
**Response**: Service status

---

## 💳 Payment Gateway Endpoints

### Initiate M-PESA Payment

```
POST /api/v1/payments/mpesa/initiate/
```

**Purpose**: Initiate M-PESA STK Push payment  
**Auth**: Required  
**Request Body**:

```json
{
  "phone_number": "+254712345678",
  "amount": 5500.0,
  "policy_number": "POL123456",
  "description": "Motor Insurance Premium"
}
```

**Response**:

```json
{
  "success": true,
  "checkout_request_id": "ws_CO_123456",
  "merchant_request_id": "12345-67890",
  "response_description": "Success. Request accepted for processing"
}
```

### Check M-PESA Payment Status

```
GET /api/v1/payments/mpesa/status/{checkout_request_id}/
```

**Purpose**: Check M-PESA payment status  
**Auth**: Required  
**Response**:

```json
{
  "result_code": "0",
  "result_description": "The service request is processed successfully.",
  "transaction_id": "OBK8H1234X",
  "amount": 5500.0,
  "phone_number": "+254712345678"
}
```

### Initiate DPO Payment

```
POST /api/v1/payments/dpo/initiate/
```

**Purpose**: Initiate DPO (card) payment  
**Auth**: Required  
**Request Body**:

```json
{
  "amount": 5500.0,
  "policy_number": "POL123456",
  "customer_email": "john@example.com",
  "customer_phone": "+254712345678"
}
```

**Response**:

```json
{
  "success": true,
  "payment_url": "https://secure.dpo.co.ke/payv2.php?ID=xxxx",
  "transaction_token": "DPO_TOKEN_12345"
}
```

### Payment Callback

```
POST /api/v1/payments/callback/
```

**Purpose**: Receive payment gateway callbacks  
**Auth**: Not Required (Validated by signature)  
**Request Body**: Gateway-specific format  
**Response**: Acknowledgment

---

## 📎 Document Upload Endpoints

### Upload KYC Document

```
POST /api/v1/documents/upload-kyc/
```

**Purpose**: Upload identity/vehicle documents  
**Auth**: Required  
**Request**: Multipart form-data  
**Fields**:

- `document_type`: (logbook_front, logbook_back, id_front, id_back, kra_pin)
- `file`: Document file (image/PDF)
- `policy_id`: Associated policy ID

**Response**:

```json
{
  "document_id": "DOC123456",
  "status": "uploaded",
  "ocr_status": "processing"
}
```

### Simulate OCR Processing

```
POST /api/v1/documents/ocr-process/
```

**Purpose**: Trigger OCR extraction (development)  
**Auth**: Required  
**Request Body**:

```json
{
  "document_id": "DOC123456"
}
```

**Response**: Extracted data

### Get Document Status

```
GET /api/v1/documents/status/{document_id}/
```

**Purpose**: Check document processing status  
**Auth**: Required  
**Response**:

```json
{
  "document_id": "DOC123456",
  "status": "processed",
  "ocr_status": "completed",
  "extracted_data": {...}
}
```

---

## 🔐 Authentication Endpoints

### Login

```
POST /api/v1/public_app/auth/login
```

**Purpose**: Agent login with username/password  
**Auth**: Not Required  
**Request Body**:

```json
{
  "username": "agent001",
  "password": "password123"
}
```

**Response**:

```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "agent001",
    "email": "agent@example.com",
    "role": "agent"
  }
}
```

### Auth Login (Alternative)

```
POST /api/v1/public_app/auth/auth_login
```

**Purpose**: Alternative login endpoint  
**Auth**: Not Required  
**Request/Response**: Same as login

### Token Refresh

```
POST /api/v1/public_app/auth/token/refresh
```

**Purpose**: Refresh expired access token  
**Auth**: Not Required  
**Request Body**:

```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response**:

```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Signup

```
POST /api/v1/public_app/auth/signup
```

**Purpose**: Register new agent  
**Auth**: Not Required  
**Request Body**: User registration data  
**Response**: User object and tokens

### Validate Phone

```
POST /api/v1/public_app/auth/validate_phone
```

**Purpose**: Validate phone number format  
**Auth**: Not Required  
**Request Body**:

```json
{
  "phone": "+254712345678"
}
```

**Response**: Validation result

### Reset Password

```
POST /api/v1/public_app/auth/reset_password_self
```

**Purpose**: Self-service password reset  
**Auth**: Required  
**Request Body**: New password  
**Response**: Success confirmation

---

## 📱 OTP Endpoints

### Send OTP

```
POST /api/v1/public_app/auth/otp/send
```

**Purpose**: Send OTP to phone number  
**Auth**: Not Required  
**Request Body**:

```json
{
  "phone_number": "+254712345678",
  "purpose": "login"
}
```

**Response**:

```json
{
  "success": true,
  "message": "OTP sent successfully",
  "otp_id": "OTP123456"
}
```

### Verify OTP

```
POST /api/v1/public_app/auth/otp/verify
```

**Purpose**: Verify OTP code  
**Auth**: Not Required  
**Request Body**:

```json
{
  "otp_id": "OTP123456",
  "otp_code": "123456"
}
```

**Response**:

```json
{
  "success": true,
  "verified": true,
  "user_id": 123
}
```

### Resend OTP

```
POST /api/v1/public_app/auth/otp/resend
```

**Purpose**: Resend OTP code  
**Auth**: Not Required  
**Request Body**:

```json
{
  "otp_id": "OTP123456"
}
```

**Response**: New OTP sent confirmation

---

## 🏥 Claims Endpoints

### Presign Claims Upload

```
POST /api/insurance/claims/presign
```

**Purpose**: Get presigned URL for claims document upload  
**Auth**: Required  
**Request Body**:

```json
{
  "file_name": "accident_photo.jpg",
  "content_type": "image/jpeg"
}
```

**Response**: Presigned URL

### Submit Claim

```
POST /api/insurance/claims/submit
```

**Purpose**: Submit insurance claim  
**Auth**: Required  
**Request Body**:

```json
{
  "policy_number": "POL123456",
  "claim_type": "accident",
  "description": "Vehicle accident on Thika Road",
  "incident_date": "2026-01-15",
  "documents": ["url1", "url2"]
}
```

**Response**: Claim object with claim number

### List Claims

```
GET /api/insurance/claims
Query params: ?policy_number=POL123456&status=pending
```

**Purpose**: List claims for agent  
**Auth**: Required  
**Response**: List of claims

### Get Claim Details

```
GET /api/insurance/claims/{claim_id}
```

**Purpose**: Get detailed claim information  
**Auth**: Required  
**Response**: Full claim object

---

## 👨‍💼 Admin Endpoints

### Manual Quotes - Agent

```
GET /api/v1/public_app/manual_quotes
POST /api/v1/public_app/manual_quotes
GET /api/v1/public_app/manual_quotes/{reference}
```

**Purpose**: Agent manual quote management  
**Auth**: Required (Agent)

### Manual Quotes - Admin

```
GET /api/v1/public_app/admin/manual_quotes
GET /api/v1/public_app/admin/manual_quotes/{reference}
PUT /api/v1/public_app/admin/manual_quotes/{reference}
```

**Purpose**: Admin manual quote approval/rejection  
**Auth**: Required (Admin)

### Campaigns - Public

```
GET /api/v1/public_app/campaigns
POST /api/v1/public_app/campaigns
```

**Purpose**: Marketing campaigns management  
**Auth**: Required

### Campaigns - Admin

```
GET /api/v1/public_app/admin/campaigns
PUT /api/v1/public_app/admin/campaigns/{id}
```

**Purpose**: Admin campaign management  
**Auth**: Required (Admin)

### Commissions

```
GET /api/v1/public_app/commissions
POST /api/v1/public_app/commissions
```

**Purpose**: Agent commission tracking  
**Auth**: Required

### Notifications

```
GET /api/v1/public_app/notifications/list
```

**Purpose**: Get agent notifications  
**Auth**: Required  
**Response**: List of notifications

---

## 🏥 Health & System Endpoints

### Health Check

```
GET /api/v1/health/
```

**Purpose**: System health check  
**Auth**: Not Required  
**Response**:

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-01-18T10:30:00Z"
}
```

### Admin Dashboard

```
GET /admin/dashboard/
```

**Purpose**: Admin dashboard view  
**Auth**: Required (Admin)  
**Response**: HTML dashboard

### Admin Dashboard API

```
GET /admin/dashboard-api/
```

**Purpose**: Dashboard data API  
**Auth**: Required (Admin)  
**Response**: Dashboard metrics

### System Health

```
GET /admin/system-health/
```

**Purpose**: Detailed system health  
**Auth**: Required (Admin)  
**Response**: System metrics

---

## 📊 Endpoint Summary

| Category          | Count   | Auth Required  |
| ----------------- | ------- | -------------- |
| Motor2 Flow       | 10      | Mostly No      |
| Motor3 Quotations | 6       | Yes            |
| Policy Management | 15      | Yes            |
| DMVIC Integration | 8       | Varies         |
| Payment Gateway   | 4       | Yes            |
| Document Upload   | 3       | Yes            |
| Authentication    | 6       | No (for login) |
| OTP               | 3       | No             |
| Claims            | 4       | Yes            |
| Admin             | 10+     | Yes (Admin)    |
| **TOTAL**         | **69+** | -              |

---

## 🔧 Common Query Parameters

### Pagination

- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 10)

### Filtering

- `status`: Filter by status (active, pending, expired, etc.)
- `agent_id`: Filter by agent
- `date_from`: Start date filter
- `date_to`: End date filter

### Sorting

- `ordering`: Field to sort by (prefix with `-` for descending)

---

## ⚡ Performance & Timeouts

### Default Timeouts

- **Standard Endpoints**: 30 seconds
- **DMVIC Endpoints**: 60 seconds (Updated Jan 18, 2026)
- **File Upload Endpoints**: 120 seconds

### Rate Limiting (Anonymous)

- **DMVIC Vehicle Search**: 20 requests/hour per IP
- **Other Public Endpoints**: 100 requests/hour per IP

### Rate Limiting (Authenticated)

- No hard limits (reasonable use expected)

---

## 🛡️ Error Response Format

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "detail": "Detailed error description",
  "code": "ERROR_CODE",
  "timestamp": "2026-01-18T10:30:00Z"
}
```

### Common HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `408`: Request Timeout (DMVIC timeouts)
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error
- `502`: Bad Gateway (upstream service error)
- `503`: Service Unavailable

---

## 📝 Notes

1. **DMVIC Integration Strategy** (Updated January 18, 2026):
   - **PataBima operates as an INTERMEDIARY (Broker)** in DMVIC's system
   - We use a **HYBRID** approach:
     - ✅ **Vehicle Search & Double Insurance**: Member Company v5 endpoints (Intermediary doesn't have these)
     - ✅ **All Certificate Operations**: Intermediary v6 endpoints (preview, validate, issue)
   - This reflects our business model: we compare prices from multiple underwriters before issuing certificates
   - Intermediary integration ensures proper commission tracking and broker status in DMVIC records

2. **DMVIC Timeouts**: All DMVIC endpoints now use 60-second timeout (updated January 18, 2026) to handle slow external API responses.

3. **Authentication**: Most endpoints require JWT Bearer token in header:

   ```
   Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
   ```

4. **Content-Type**: All POST/PUT requests expect `application/json` unless specified (e.g., file uploads use `multipart/form-data`).

5. **CORS**: Enabled for all origins in development. Configure for production.

6. **API Versioning**: Currently using `/api/v1/` prefix. May introduce v2 for breaking changes.

7. **Caching**: Vehicle search results cached for 24 hours to reduce DMVIC API calls.

8. **Double Insurance**: DMVIC double-insurance validation is MANDATORY and BLOCKS policy submission if active cover is detected.

---

**End of Endpoints Documentation** ✅
